"""
Real System Metrics Endpoints
Provides actual CPU, memory, disk usage from the server
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import psutil
import time
from datetime import datetime


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_metrics(request):
    """
    Get real-time system metrics
    Returns CPU, memory, disk usage, and uptime
    """
    try:
        # Get CPU usage (percentage)
        cpu_percent = psutil.cpu_percent(interval=0.1)
        
        # Get memory usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        memory_used_gb = memory.used / (1024 ** 3)
        memory_total_gb = memory.total / (1024 ** 3)
        
        # Get disk usage
        disk = psutil.disk_usage('/')
        disk_percent = disk.percent
        disk_used_gb = disk.used / (1024 ** 3)
        disk_total_gb = disk.total / (1024 ** 3)
        
        # Get system uptime
        boot_time = psutil.boot_time()
        uptime_seconds = time.time() - boot_time
        
        return Response({
            'cpu': round(cpu_percent, 1),
            'memory': round(memory_percent, 1),
            'memory_used_gb': round(memory_used_gb, 2),
            'memory_total_gb': round(memory_total_gb, 2),
            'disk': round(disk_percent, 1),
            'disk_used_gb': round(disk_used_gb, 2),
            'disk_total_gb': round(disk_total_gb, 2),
            'uptime': int(uptime_seconds),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return Response({
            'error': str(e),
            'cpu': 0,
            'memory': 0,
            'disk': 0,
            'uptime': 0,
            'timestamp': datetime.now().isoformat()
        }, status=500)
