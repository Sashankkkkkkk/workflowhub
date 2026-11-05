from rest_framework.routers import DefaultRouter

from .views import WorkflowItemViewSet

router = DefaultRouter()
router.register(r"workflow-items", WorkflowItemViewSet, basename="workflow-item")

urlpatterns = router.urls
