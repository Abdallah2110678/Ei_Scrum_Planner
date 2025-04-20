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

    performances = DeveloperPerformance.objects.filter(project_id=project_id)
    
    # Headers
    headers = ["Developer", "Sprint", "Category", "Tasks", "Productivity"]
    x_positions = [50, 150, 250, 350, 450]
    
    p.setFont("Helvetica-Bold", 10)
    for header, x in zip(headers, x_positions):
        p.drawString(x, y, header)
    y -= 20

    # Data rows
    p.setFont("Helvetica", 10)
    for perf in performances:
        if y < 50:  # Check if we need a new page
            p.showPage()
            y = 750
        
        p.drawString(50, y, str(perf.user.name))
        p.drawString(150, y, f"Sprint {perf.sprint.id}")
        p.drawString(250, y, perf.category)
        p.drawString(350, y, str(perf.total_tasks))
        p.drawString(450, y, f"{perf.productivity:.2f}")
        y -= 15

    # Emotion Data Section
    y -= 30
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, y, "Team Emotional Status")
    y -= 20

    # Fix the emotions query
    from project_users.models import ProjectUsers
    user_ids = ProjectUsers.objects.filter(project_id=project_id).values_list('user_id', flat=True)
    emotions = DailyEmotion.objects.filter(user_id__in=user_ids)
    
    if emotions.exists():
        p.setFont("Helvetica", 10)
        for emotion in emotions:
            if y < 50:
                p.showPage()
                y = 750
            
            p.drawString(50, y, f"{emotion.user.name}: {emotion.first_emotion}")
            y -= 15
    else:
        p.drawString(50, y, "No emotion data available")
        y -= 15

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
