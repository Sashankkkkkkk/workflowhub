from rest_framework import serializers

from .models import WorkflowItem


class WorkflowItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowItem
        fields = ("id", "title", "description", "status", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")
