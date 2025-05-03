from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from tasks.models import Task
from developer_performance.models import DeveloperPerformance
from developer_performance.serializers import DeveloperPerformanceSerializer
from projects.models import Project
from project_users.models import ProjectUsers
from django.db.models import Sum, Count
from django.http import HttpResponse
from emotion_detection.models import DailyEmotion
from reportlab.pdfgen import canvas # type: ignore
from reportlab.lib.pagesizes import letter # type: ignore
from reportlab.lib import colors # type: ignore
from io import BytesIO
from datetime import datetime
from django.db.models import Avg
from django.db.models.functions import TruncDate
User = get_user_model()

# ------------------------------
# Utility to calculate per-user productivity
# ------------------------------
def calculate_productivity_for_user(user, project_id):
    tasks = Task.objects.filter(user=user, project_id=project_id)

    grouped_data = tasks.values('sprint', 'task_category', 'task_complexity') \
        .annotate(total_tasks=Count('id'), total_effort=Sum('actual_effort'))

    result_entries = []

    for item in grouped_data:
        sprint_id = item['sprint']
        if not sprint_id:
            continue  # ✅ Skip if task has no sprint

        category = item['task_category']
        complexity = item['task_complexity']
        total_tasks = item['total_tasks']
        total_effort = item['total_effort'] or 0.0
        productivity = total_effort / total_tasks if total_tasks else 0

        try:
            performance, _ = DeveloperPerformance.objects.update_or_create(
                user=user,
                project_id=project_id,
                sprint_id=sprint_id,
                category=category,
                complexity=complexity,
                defaults={
                    'total_tasks': total_tasks,
                    'total_actual_effort': total_effort,
                    'productivity': productivity
                }
            )
            result_entries.append(performance)
        except Exception as e:
            print(f"Error saving performance for {user} in sprint {sprint_id}: {e}")

    return result_entries

# ------------------------------
# All developers in a project
# ------------------------------
@api_view(['POST'])
def calculate_developer_productivity_all(request):
    project_id = request.query_params.get('project_id')
    if not project_id:
        return Response({"error": "project_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

    user_ids = ProjectUsers.objects.filter(project_id=project_id).values_list('user_id', flat=True)
    users = User.objects.filter(id__in=user_ids)

    all_entries = []
    for user in users:
        entries = calculate_productivity_for_user(user, project_id)
        all_entries.extend(entries)

    serialized = DeveloperPerformanceSerializer(all_entries, many=True)
    return Response(serialized.data, status=status.HTTP_200_OK)

# ------------------------------
# One developer in a project
# ------------------------------
@api_view(['POST'])
def calculate_developer_productivity_single(request, user_id):
    project_id = request.query_params.get('project_id')
    if not project_id:
        return Response({"error": "project_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    entries = calculate_productivity_for_user(user, project_id)
    serialized = DeveloperPerformanceSerializer(entries, many=True)
    return Response(serialized.data, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_developer_productivity_list(request):
    project_id = request.query_params.get('project_id')
    user_id = request.query_params.get('user_id')
    category = request.query_params.get('task_category')
    complexity = request.query_params.get('task_complexity')
    sprint_id = request.query_params.get('sprint_id')

    if not project_id:
        return Response({"error": "project_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    filters = {'project_id': project_id}

    if user_id:
        filters['user_id'] = user_id
    if category:
        filters['category'] = category
    if complexity:
        filters['complexity'] = complexity
    if sprint_id:
        filters['sprint_id'] = sprint_id

    queryset = DeveloperPerformance.objects.filter(**filters)
    serialized = DeveloperPerformanceSerializer(queryset, many=True)
    return Response(serialized.data, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_sprint_overall_productivity(request):
    project_id = request.query_params.get('project_id')
    sprint_id = request.query_params.get('sprint_id')

    if not project_id or not sprint_id:
        return Response({"error": "project_id and sprint_id are required"}, status=400)

    queryset = DeveloperPerformance.objects.filter(project_id=project_id, sprint_id=sprint_id)
    total_effort = queryset.aggregate(Sum('total_actual_effort'))['total_actual_effort__sum'] or 0
    total_tasks = queryset.aggregate(Sum('total_tasks'))['total_tasks__sum'] or 0
    overall_productivity = total_effort / total_tasks if total_tasks else 0

    return Response({
        "sprint_id": sprint_id,
        "overall_productivity": round(overall_productivity, 2),
        "total_effort": total_effort,
        "total_tasks": total_tasks
    })


@api_view(['GET'])
def generate_dashboard_pdf(request):
    project_id = request.query_params.get('project_id')
    if not project_id:
        return Response({"error": "project_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    # Create a BytesIO buffer for the PDF
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    # Define color scheme (professional blues and grays)
    header_color = colors.Color(0.1, 0.3, 0.5)  # Dark blue
    subheader_color = colors.Color(0.2, 0.4, 0.6)  # Medium blue
    highlight_color = colors.Color(0.3, 0.5, 0.7)  # Light blue
    text_color = colors.Color(0.1, 0.1, 0.1)  # Near black
    alt_row_color = colors.Color(0.95, 0.95, 0.95)  # Very light gray
    positive_color = colors.Color(0.2, 0.6, 0.3)  # Green
    negative_color = colors.Color(0.7, 0.2, 0.2)  # Red
    neutral_color = colors.Color(0.6, 0.6, 0.2)  # Amber
    
    # Set up initial position
    y = 750  # Starting y position
    
    # Add a header bar
    p.setFillColor(header_color)
    p.rect(30, y+10, 550, 30, fill=1)
    
    # Title
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y+20, f"Project Performance Report")
    y -= 40
    
    p.setFillColor(text_color)
    p.setFont("Helvetica", 12)
    p.drawString(50, y, f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    y -= 40

    # Get project users
    from project_users.models import ProjectUsers
    user_ids = ProjectUsers.objects.filter(project_id=project_id).values_list('user_id', flat=True)
    users = User.objects.filter(id__in=user_ids)
    
    # Get all sprints for the project
    from sprints.models import Sprint
    sprints = Sprint.objects.filter(
        id__in=Task.objects.filter(project_id=project_id).values_list('sprint', flat=True).distinct()
    ).order_by('id')
    
    # For each sprint, show detailed performance of all developers
    for sprint in sprints:
        if y < 100:  # Check if we need a new page
            p.showPage()
            p.setFillColor(text_color)
            y = 750
        
        # Sprint header with background
        p.setFillColor(subheader_color)
        p.rect(30, y-5, 550, 25, fill=1)
        p.setFillColor(colors.white)
        p.setFont("Helvetica-Bold", 14)
        p.drawString(50, y, f"Sprint: {sprint.sprint_name}")
        y -= 30
        
        # Sprint details
        p.setFillColor(text_color)
        p.setFont("Helvetica", 10)
        p.drawString(50, y, f"Duration: {sprint.duration} days")
        p.drawString(250, y, f"Start: {sprint.start_date.strftime('%Y-%m-%d')}")
        p.drawString(450, y, f"End: {sprint.end_date.strftime('%Y-%m-%d') if sprint.end_date else 'In Progress'}")
        y -= 15
        
        p.drawString(50, y, f"Goal: {sprint.sprint_goal or 'No goal specified'}")
        y -= 25
        
        # Tasks and Productivity Section
        p.setFillColor(highlight_color)
        p.rect(30, y-5, 550, 25, fill=1)
        p.setFillColor(colors.white)
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, "Developer Performance")
        y -= 25
        
        # Headers with background
        p.setFillColor(header_color)
        p.rect(30, y-5, 550, 20, fill=1)
        p.setFillColor(colors.white)
        p.setFont("Helvetica-Bold", 10)
        headers = ["Developer", "Category", "Complexity", "Tasks", "Effort", "Productivity", "Rework"]
        x_positions = [50, 150, 220, 290, 340, 400, 470]
        
        for header, x in zip(headers, x_positions):
            p.drawString(x, y, header)
        y -= 20
        
        # Get performance data for this sprint
        performances = DeveloperPerformance.objects.filter(
            project_id=project_id,
            sprint_id=sprint.id
        ).select_related('user')
        
        # Group performances by user
        user_performances = {}
        for perf in performances:
            if perf.user.id not in user_performances:
                user_performances[perf.user.id] = []
            user_performances[perf.user.id].append(perf)
        
        # Get rework data for this sprint
        rework_data = Task.objects.filter(
            project_id=project_id,
            sprint=sprint.id,
            rework_count__gt=0
        ).values('user').annotate(rework_count=Sum('rework_count'))
        
        rework_by_user = {item['user']: item['rework_count'] for item in rework_data}
        
        # Data rows
        p.setFillColor(text_color)
        p.setFont("Helvetica", 10)
        
        if not performances:
            p.drawString(50, y, "No performance data for this sprint")
            y -= 15
        else:
            row_count = 0
            for user_id, user_perfs in user_performances.items():
                user = User.objects.get(id=user_id)
                
                for perf in user_perfs:
                    if y < 50:  # Check if we need a new page
                        p.showPage()
                        p.setFillColor(text_color)
                        y = 750
                    
                    # Alternate row colors
                    if row_count % 2 == 0:
                        p.setFillColor(alt_row_color)
                        p.rect(30, y-5, 550, 20, fill=1)
                    
                    rework_count = rework_by_user.get(user.id, 0)
                    
                    p.setFillColor(text_color)
                    p.drawString(50, y, user.name)
                    p.drawString(150, y, perf.category)
                    p.drawString(220, y, perf.complexity)
                    p.drawString(290, y, str(perf.total_tasks))
                    p.drawString(340, y, f"{perf.total_actual_effort:.1f}")
                    
                    # Color-code productivity (higher is better)
                    if perf.productivity > 1.5:
                        p.setFillColor(positive_color)
                    elif perf.productivity < 0.8:
                        p.setFillColor(negative_color)
                    else:
                        p.setFillColor(text_color)
                    p.drawString(400, y, f"{perf.productivity:.2f}")
                    
                    # Color-code rework (lower is better)
                    p.setFillColor(positive_color if rework_count == 0 else 
                                  negative_color if rework_count > 2 else 
                                  neutral_color)
                    p.drawString(470, y, str(rework_count))
                    
                    p.setFillColor(text_color)
                    y -= 20
                    row_count += 1
        
        y -= 20
        
        # Emotion Section for this sprint
        p.setFillColor(highlight_color)
        p.rect(30, y-5, 550, 25, fill=1)
        p.setFillColor(colors.white)
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, "Team Emotions During Sprint")
        y -= 25
        
        # Get emotion data for all users during this sprint
        sprint_emotions = DailyEmotion.objects.filter(
            user__in=users,
            date__range=(sprint.start_date, sprint.end_date or datetime.now())
        ).order_by('date')
        
        if sprint_emotions.exists():
            # Headers with background
            p.setFillColor(header_color)
            p.rect(30, y-5, 550, 20, fill=1)
            p.setFillColor(colors.white)
            p.setFont("Helvetica-Bold", 10)
            p.drawString(50, y, "Date")
            p.drawString(150, y, "Developer")
            p.drawString(250, y, "Primary Emotions")
            p.drawString(400, y, "Sentiment")
            y -= 20
            
            # Group emotions by date and user
            emotions_by_date_user = {}
            for emotion in sprint_emotions:
                date_str = emotion.date.strftime('%Y-%m-%d')
                key = (date_str, emotion.user.id)
                if key not in emotions_by_date_user:
                    emotions_by_date_user[key] = []
                emotions_by_date_user[key].append(emotion)
            
            # Data rows
            p.setFillColor(text_color)
            p.setFont("Helvetica", 10)
            row_count = 0
            for (date_str, user_id), date_emotions in sorted(emotions_by_date_user.items()):
                if y < 50:  # Check if we need a new page
                    p.showPage()
                    p.setFillColor(text_color)
                    y = 750
                
                # Alternate row colors
                if row_count % 2 == 0:
                    p.setFillColor(alt_row_color)
                    p.rect(30, y-5, 550, 20, fill=1)
                
                user = User.objects.get(id=user_id)
                
                # Collect all emotions for the day
                all_emotions = []
                for e in date_emotions:
                    if e.first_emotion:
                        all_emotions.append(e.first_emotion)
                    if e.second_emotion:
                        all_emotions.append(e.second_emotion)
                    if e.third_emotion:
                        all_emotions.append(e.third_emotion)
                
                # Count emotion frequencies
                emotion_count = {}
                for emotion in all_emotions:
                    emotion_count[emotion] = emotion_count.get(emotion, 0) + 1
                
                # Get top 3 emotions
                top_emotions = sorted(emotion_count.items(), key=lambda x: x[1], reverse=True)[:3]
                emotion_summary = ', '.join([f"{emotion}" for emotion, count in top_emotions])
                
                # Calculate average sentiment using emotion weights
                avg_weight = sum(e.average_emotion_weight or 0.5 for e in date_emotions) / len(date_emotions) if date_emotions else 0.5
                sentiment_text = "Positive" if avg_weight > 0.7 else "Negative" if avg_weight < 0.4 else "Neutral"
                
                p.setFillColor(text_color)
                p.drawString(50, y, date_str)
                p.drawString(150, y, user.name)
                p.drawString(250, y, emotion_summary or "No emotions recorded")
                
                # Color-code sentiment
                if avg_weight > 0.7:
                    p.setFillColor(positive_color)
                elif avg_weight < 0.4:
                    p.setFillColor(negative_color)
                else:
                    p.setFillColor(neutral_color)
                p.drawString(400, y, f"{sentiment_text} ({avg_weight:.2f})")
                
                y -= 20
                row_count += 1
        else:
            p.setFillColor(text_color)
            p.drawString(50, y, "No emotion data recorded for this sprint")
            y -= 20
        
        y -= 20  # Space between sprints
    
    # Summary Section
    p.showPage()
    y = 750
    
    # Add a header bar
    p.setFillColor(header_color)
    p.rect(30, y+10, 550, 30, fill=1)
    
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y+20, "Project Summary")
    y -= 40
    
    # Overall Productivity
    p.setFillColor(highlight_color)
    p.rect(30, y-5, 550, 25, fill=1)
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "Overall Productivity by Sprint")
    y -= 25
    
    # Headers with background
    p.setFillColor(header_color)
    p.rect(30, y-5, 550, 20, fill=1)
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 10)
    p.drawString(50, y, "Sprint")
    p.drawString(150, y, "Total Tasks")
    p.drawString(250, y, "Total Effort")
    p.drawString(350, y, "Productivity")
    p.drawString(450, y, "Rework %")
    y -= 20
    
    # Get summary data by sprint
    p.setFillColor(text_color)
    row_count = 0
    for sprint in sprints:
        if y < 50:  # Check if we need a new page
            p.showPage()
            p.setFillColor(text_color)
            y = 750
        
        # Alternate row colors
        if row_count % 2 == 0:
            p.setFillColor(alt_row_color)
            p.rect(30, y-5, 550, 20, fill=1)
        
        # Get productivity data
        sprint_perf = DeveloperPerformance.objects.filter(project_id=project_id, sprint_id=sprint.id)
        total_effort = sprint_perf.aggregate(Sum('total_actual_effort'))['total_actual_effort__sum'] or 0
        total_tasks = sprint_perf.aggregate(Sum('total_tasks'))['total_tasks__sum'] or 0
        overall_productivity = total_effort / total_tasks if total_tasks else 0
        
        # Get rework data
        all_sprint_tasks = Task.objects.filter(project_id=project_id, sprint=sprint.id).count()
        rework_tasks = Task.objects.filter(
            project_id=project_id,
            sprint=sprint.id,
            rework_count__gt=0
        ).count()
        
        rework_percentage = (rework_tasks / all_sprint_tasks * 100) if all_sprint_tasks else 0
        
        p.setFillColor(text_color)
        p.drawString(50, y, sprint.sprint_name)
        p.drawString(150, y, str(total_tasks))
        p.drawString(250, y, f"{total_effort:.1f}")
        
        # Color-code productivity
        if overall_productivity > 1.5:
            p.setFillColor(positive_color)
        elif overall_productivity < 0.8:
            p.setFillColor(negative_color)
        else:
            p.setFillColor(text_color)
        p.drawString(350, y, f"{overall_productivity:.2f}")
        
        # Color-code rework percentage
        if rework_percentage < 5:
            p.setFillColor(positive_color)
        elif rework_percentage > 15:
            p.setFillColor(negative_color)
        else:
            p.setFillColor(neutral_color)
        p.drawString(450, y, f"{rework_percentage:.1f}%")
        
        y -= 20
        row_count += 1
    
    y -= 20
    
    # Add Developer Summary Section
    p.setFillColor(highlight_color)
    p.rect(30, y-5, 550, 25, fill=1)
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "Developer Summary")
    y -= 25
    
    # Headers for developer summary
    p.setFillColor(header_color)
    p.rect(30, y-5, 550, 20, fill=1)
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 10)
    p.drawString(50, y, "Developer")
    p.drawString(150, y, "Total Tasks")
    p.drawString(250, y, "Total Effort")
    p.drawString(350, y, "Avg Productivity")
    p.drawString(450, y, "Rework Count")
    y -= 20
    
    # Get summary data by developer
    p.setFillColor(text_color)
    row_count = 0
    for user in users:
        if y < 50:  # Check if we need a new page
            p.showPage()
            p.setFillColor(text_color)
            y = 750
        
        # Alternate row colors
        if row_count % 2 == 0:
            p.setFillColor(alt_row_color)
            p.rect(30, y-5, 550, 20, fill=1)
        
        # Get user's performance data across all sprints
        user_perf = DeveloperPerformance.objects.filter(
            user=user,
            project_id=project_id
        )
        
        total_tasks = user_perf.aggregate(Sum('total_tasks'))['total_tasks__sum'] or 0
        total_effort = user_perf.aggregate(Sum('total_actual_effort'))['total_actual_effort__sum'] or 0
        
        # Calculate average productivity
        avg_productivity = total_effort / total_tasks if total_tasks else 0
        
        # Get rework count
        rework_count = Task.objects.filter(
            user=user,
            project_id=project_id,
            rework_count__gt=0
        ).aggregate(Sum('rework_count'))['rework_count__sum'] or 0
        
        p.setFillColor(text_color)
        p.drawString(50, y, user.name)
        p.drawString(150, y, str(total_tasks))
        p.drawString(250, y, f"{total_effort:.1f}")
        
        # Color-code productivity
        if avg_productivity > 1.5:
            p.setFillColor(positive_color)
        elif avg_productivity < 0.8:
            p.setFillColor(negative_color)
        else:
            p.setFillColor(text_color)
        p.drawString(350, y, f"{avg_productivity:.2f}")
        
        # Color-code rework
        if rework_count == 0:
            p.setFillColor(positive_color)
        elif rework_count > 5:
            p.setFillColor(negative_color)
        else:
            p.setFillColor(neutral_color)
        p.drawString(450, y, str(rework_count))
        
        y -= 20
        row_count += 1
    
    y -= 20
    
    # Team Emotion Summary
    p.setFillColor(highlight_color)
    p.rect(30, y-5, 550, 25, fill=1)
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "Team Emotion Summary")
    y -= 25
    
    # Get emotion data for the whole team - grouped by user and sprint to avoid duplication
    # First, get all sprints with their date ranges
    sprint_date_ranges = {
        sprint.id: (sprint.start_date, sprint.end_date or datetime.now())
        for sprint in sprints
    }
    
    # Create a section for average emotions per sprint per user
    p.setFillColor(header_color)
    p.rect(30, y-5, 550, 20, fill=1)
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 10)
    p.drawString(50, y, "Sprint")
    p.drawString(150, y, "Developer")
    p.drawString(250, y, "Avg Sentiment")
    p.drawString(350, y, "Weight")
    p.drawString(450, y, "Dominant Emotions")
    y -= 20
    
    # Process emotions by sprint and user
    row_count = 0
    for sprint in sprints:
        start_date, end_date = sprint_date_ranges[sprint.id]
        
        # Get emotions for this sprint
        sprint_emotions = DailyEmotion.objects.filter(
            user__in=users,
            date__range=(start_date, end_date)
        )
        
        # Group by user
        emotions_by_user = {}
        for emotion in sprint_emotions:
            if emotion.user.id not in emotions_by_user:
                emotions_by_user[emotion.user.id] = []
            emotions_by_user[emotion.user.id].append(emotion)
        
        # Display average emotion for each user in this sprint
        for user_id, user_emotions in emotions_by_user.items():
            if y < 50:  # Check if we need a new page
                p.showPage()
                p.setFillColor(text_color)
                y = 750
            
            # Alternate row colors
            if row_count % 2 == 0:
                p.setFillColor(alt_row_color)
                p.rect(30, y-5, 550, 20, fill=1)
            
            user = User.objects.get(id=user_id)
            
            # Calculate average sentiment
            avg_weight = sum(e.average_emotion_weight or 0.5 for e in user_emotions) / len(user_emotions) if user_emotions else 0.5
            sentiment_text = "Positive" if avg_weight > 0.7 else "Negative" if avg_weight < 0.4 else "Neutral"
            
            # Collect all emotions for this user in this sprint (without duplicates)
            all_emotions = []
            for e in user_emotions:
                if e.first_emotion and e.first_emotion not in all_emotions:
                    all_emotions.append(e.first_emotion)
                if e.second_emotion and e.second_emotion not in all_emotions:
                    all_emotions.append(e.second_emotion)
                if e.third_emotion and e.third_emotion not in all_emotions:
                    all_emotions.append(e.third_emotion)
            
            # Count emotion frequencies
            emotion_count = {}
            for emotion in all_emotions:
                emotion_count[emotion] = emotion_count.get(emotion, 0) + 1
            
            # Get top 3 emotions
            top_emotions = sorted(emotion_count.items(), key=lambda x: x[1], reverse=True)[:3]
            emotion_summary = ', '.join([f"{emotion}" for emotion, count in top_emotions])
            
            p.setFillColor(text_color)
            p.drawString(50, y, sprint.sprint_name)
            p.drawString(150, y, user.name)
            
            # Color-code sentiment
            if avg_weight > 0.7:
                p.setFillColor(positive_color)
            elif avg_weight < 0.4:
                p.setFillColor(negative_color)
            else:
                p.setFillColor(neutral_color)
            p.drawString(250, y, sentiment_text)
            p.drawString(350, y, f"{avg_weight:.2f}")
            
            p.setFillColor(text_color)
            p.drawString(450, y, emotion_summary or "None")
            
            y -= 20
            row_count += 1
    
    y -= 20
    
    # Overall team emotion trends (across all sprints)
    p.setFillColor(highlight_color)
    p.rect(30, y-5, 550, 25, fill=1)
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "Overall Team Emotion Trends")
    y -= 25
    
    # Get aggregated emotion data by date (without duplicating by user)
    team_emotions = DailyEmotion.objects.filter(
        user__in=users
    ).values('date').annotate(
        avg_weight=Avg('average_emotion_weight')
    ).order_by('date')
    
    if team_emotions:
        # Headers
        p.setFillColor(header_color)
        p.rect(30, y-5, 550, 20, fill=1)
        p.setFillColor(colors.white)
        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, y, "Date")
        p.drawString(150, y, "Team Sentiment")
        p.drawString(250, y, "Weight")
        y -= 20
        
        # Data rows
        p.setFillColor(text_color)
        p.setFont("Helvetica", 10)
        row_count = 0
        for entry in team_emotions:
            if y < 50:  # Check if we need a new page
                p.showPage()
                p.setFillColor(text_color)
                y = 750
            
            # Alternate row colors
            if row_count % 2 == 0:
                p.setFillColor(alt_row_color)
                p.rect(30, y-5, 550, 20, fill=1)
            
            date_str = entry['date'].strftime('%Y-%m-%d')
            avg_weight = entry['avg_weight'] or 0.5
            sentiment_text = "Positive" if avg_weight > 0.7 else "Negative" if avg_weight < 0.4 else "Neutral"
            
            p.setFillColor(text_color)
            p.drawString(50, y, date_str)
            
            # Color-code sentiment
            if avg_weight > 0.7:
                p.setFillColor(positive_color)
            elif avg_weight < 0.4:
                p.setFillColor(negative_color)
            else:
                p.setFillColor(neutral_color)
            p.drawString(150, y, sentiment_text)
            p.drawString(250, y, f"{avg_weight:.2f}")
            
            y -= 20
            row_count += 1
    else:
        p.setFillColor(text_color)
        p.drawString(50, y, "No team emotion data available")
    
    # Add page numbers to all pages
    page_num = p.getPageNumber()
    for i in range(1, page_num + 1):
        p.setFillColor(text_color)
        p.setFont("Helvetica", 8)
        p.drawRightString(550, 30, f"Page {i} of {page_num}")
        if i < page_num:
            p.showPage()
    
    # Save the PDF
    p.showPage()
    p.save()
    
    # Get the value of the buffer and return it
    pdf = buffer.getvalue()
    buffer.close()
    
    # Create the HTTP response with PDF content
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="project_report.pdf"'
    response.write(pdf)
    
    return response