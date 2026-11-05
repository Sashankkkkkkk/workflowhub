from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import WorkflowItem

User = get_user_model()


class AuthFlowTests(APITestCase):
    def test_register_login_logout(self):
        res = self.client.post(
            "/api/auth/register/",
            {"username": "alice", "email": "a@example.com", "password": "S3cure-pass-77"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", res.data)

        res = self.client.post(
            "/api/auth/login/", {"username": "alice", "password": "S3cure-pass-77"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        token = res.data["token"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        res = self.client.post("/api/auth/logout/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        # The revoked token must no longer work.
        res = self.client.get("/api/workflow-items/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_rejects_bad_password(self):
        User.objects.create_user("bob", password="S3cure-pass-77")
        res = self.client.post(
            "/api/auth/login/", {"username": "bob", "password": "wrong"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_rejects_weak_password(self):
        res = self.client.post(
            "/api/auth/register/", {"username": "carl", "password": "12345678"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class WorkflowItemCrudTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("dana", password="S3cure-pass-77")
        self.other = User.objects.create_user("eve", password="S3cure-pass-77")
        self.client.force_authenticate(self.user)

    def test_requires_authentication(self):
        self.client.force_authenticate(None)
        self.assertEqual(
            self.client.get("/api/workflow-items/").status_code, status.HTTP_401_UNAUTHORIZED
        )

    def test_full_crud_cycle(self):
        res = self.client.post(
            "/api/workflow-items/",
            {"title": "Write report", "description": "Task 1"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["status"], "pending")
        item_id = res.data["id"]

        res = self.client.get(f"/api/workflow-items/{item_id}/")
        self.assertEqual(res.data["title"], "Write report")

        res = self.client.patch(
            f"/api/workflow-items/{item_id}/", {"status": "in_progress"}, format="json"
        )
        self.assertEqual(res.data["status"], "in_progress")

        res = self.client.put(
            f"/api/workflow-items/{item_id}/",
            {"title": "Write report v2", "description": "Edited", "status": "completed"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "completed")

        res = self.client.delete(f"/api/workflow-items/{item_id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(WorkflowItem.objects.count(), 0)

    def test_invalid_status_rejected(self):
        res = self.client.post(
            "/api/workflow-items/", {"title": "x", "status": "bogus"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_users_cannot_see_each_others_items(self):
        WorkflowItem.objects.create(owner=self.other, title="Secret")
        res = self.client.get("/api/workflow-items/")
        self.assertEqual(len(res.data), 0)


class HealthTests(APITestCase):
    def test_health_is_public(self):
        res = self.client.get("/api/health/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "ok"})
