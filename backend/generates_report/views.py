from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from developer_performance.models import DeveloperPerformance
from emotion_detection.models import DailyEmotion
from tasks.models import Task
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from io import BytesIO
from datetime import datetime
from django.db.models import Avg
from django.db.models.functions import TruncDate

@api_view(['GET'])
def generate_dashboard_pdf(request):
    project_id = request.query_params.get('project_id')
    if not project_id:
        return Response({"error": "project_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    # Create a BytesIO buffer for the PDF
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    # Set up initial position
    y = 750  # Starting y position
    
    # Title
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y, f"Project Performance Report")
    y -= 30
    
    p.setFont("Helvetica", 12)
    p.drawString(50, y, f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    y -= 40

    # Developer Performance Section
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, y, "Developer Performance")
    y -= 20

    # Modified Developer Performance Section
    performances = DeveloperPerformance.objects.filter(project_id=project_id)\
        .select_related('user', 'sprint')\
        .order_by('user__name', 'sprint__id', 'category')\
        .distinct()
    
    # Group performances by user
    user_performances = {}
    for perf in performances:
        key = (perf.user.name, perf.sprint.id, perf.category)
        if key not in user_performances:
            user_performances[key] = {
                'user': perf.user.name,
                'sprint': f"Sprint {perf.sprint.id}",
                'category': perf.category,
                'total_tasks': perf.total_tasks,
                'productivity': perf.productivity
            }
    
    # Headers
    headers = ["Developer", "Sprint", "Category", "Tasks", "Productivity"]
    x_positions = [50, 150, 250, 350, 450]
    
    p.setFont("Helvetica-Bold", 10)
    for header, x in zip(headers, x_positions):
        p.drawString(x, y, header)
    y -= 20
    
    # Data rows
    p.setFont("Helvetica", 10)
    for perf_data in user_performances.values():
        if y < 50:  # Check if we need a new page
            p.showPage()
            y = 750
        
        p.drawString(50, y, perf_data['user'])
        p.drawString(150, y, perf_data['sprint'])
        p.drawString(250, y, perf_data['category'])
        p.drawString(350, y, str(perf_data['total_tasks']))
        p.drawString(450, y, f"{perf_data['productivity']:.2f}")
        y -= 15

    # Modified Emotion Data Section
    y -= 30
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, y, "Team Emotional Status by Sprint")
    y -= 20

    # Get emotions grouped by sprint and user
    from project_users.models import ProjectUsers
    user_ids = ProjectUsers.objects.filter(project_id=project_id).values_list('user_id', flat=True)
    
    # Get all sprints for the project with distinct values
    sprints = performances.values_list('sprint__id', 'sprint__sprint_name', 'sprint__start_date', 'sprint__end_date')\
        .distinct()\
        .order_by('sprint__id')
    
    # Headers for emotion section
    p.setFont("Helvetica-Bold", 10)
    p.drawString(50, y, "Sprint")
    p.drawString(150, y, "Developer")
    p.drawString(300, y, "Predominant Emotions")
    y -= 20

    p.setFont("Helvetica", 10)
    processed_emotions = set()  # Track processed sprint-user combinations

    for sprint_data in sprints:
        sprint_id, sprint_name, start_date, end_date = sprint_data
        
        if not start_date or not end_date:
            continue

        sprint_emotions = DailyEmotion.objects.filter(
            user_id__in=user_ids,
            date__range=(start_date, end_date)
        ).select_related('user')

        # Group emotions by user
        user_emotions = {}
        for emotion in sprint_emotions:
            emotion_key = (sprint_id, emotion.user.id)
            if emotion_key in processed_emotions:
                continue
                
            processed_emotions.add(emotion_key)
            
            if emotion.user.id not in user_emotions:
                user_emotions[emotion.user.id] = {
                    'name': emotion.user.name,
                    'emotions': []
                }
            user_emotions[emotion.user.id]['emotions'].extend([
                emotion.first_emotion,
                emotion.second_emotion,
                emotion.third_emotion
            ])

        # Print sprint header if there are emotions to display
        if user_emotions:
            if y < 50:
                p.showPage()
                y = 750
            p.setFont("Helvetica-Bold", 10)
            p.drawString(50, y, f"Sprint {sprint_id}")
            y -= 15

            # Print each user's emotions
            p.setFont("Helvetica", 10)
            for user_data in user_emotions.values():
                if y < 50:
                    p.showPage()
                    y = 750
                
                # Count emotion frequencies
                emotion_count = {}
                for emotion in user_data['emotions']:
                    if emotion:
                        emotion_count[emotion] = emotion_count.get(emotion, 0) + 1
                
                # Get top 3 emotions
                top_emotions = sorted(emotion_count.items(), key=lambda x: x[1], reverse=True)[:3]
                emotion_summary = ', '.join([f"{emotion} ({count})" for emotion, count in top_emotions])
                
                p.drawString(150, y, user_data['name'])
                p.drawString(300, y, emotion_summary or "No emotions recorded")
                y -= 15
            
            y -= 10  # Add space between sprints

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
