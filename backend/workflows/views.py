from rest_framework import viewsets

from .models import WorkflowItem
from .serializers import WorkflowItemSerializer


class WorkflowItemViewSet(viewsets.ModelViewSet):
    """Full CRUD for workflow items. Users can only see and change their own items."""

    serializer_class = WorkflowItemSerializer

    def get_queryset(self):
        return WorkflowItem.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
