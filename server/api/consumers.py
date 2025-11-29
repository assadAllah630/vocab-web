import json
import psutil
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User

class SystemHealthConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Check permission (simplified for now, ideally check token)
        await self.accept()
        self.keep_sending = True
        asyncio.create_task(self.send_health_updates())

    async def disconnect(self, close_code):
        self.keep_sending = False

    async def send_health_updates(self):
        while self.keep_sending:
            try:
                cpu_percent = psutil.cpu_percent(interval=None)
                memory = psutil.virtual_memory()
                
                # Get active users (sync to async)
                # active_users = await sync_to_async(User.objects.filter(is_active=True).count)()
                
                data = {
                    'cpu': cpu_percent,
                    'memory': memory.percent,
                    'memory_used': memory.used,
                    'memory_total': memory.total,
                }
                
                await self.send(text_data=json.dumps(data))
                await asyncio.sleep(2) # Update every 2 seconds
            except Exception as e:
                print(f"Error sending health update: {e}")
                await asyncio.sleep(5)
