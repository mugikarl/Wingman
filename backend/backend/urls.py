from django.contrib import admin
from django.urls import path, include
from api import views
from api.views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    # path('', views.home, name='test_jwt'),
    path('fetch-data/', views.fetch_data, name='fetch_data'),
    # path('api/user/register/', CreateUserView.as_view(), name="register"),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # path('api-auth/', include('rest_framework.urls')),
    path('api/login/', views.login_view, name='login'),
    # path('api/csrf/', views.csrf_view, name='csrf'),
    path('api/test/', views.test_connection, name='test_connection'),
    # path('api/dashboard/', DashboardView.as_view(), name='dashboard'),  
    path("api/add-employee/", views.add_employee, name="add_employee"),
    path("api/delete-employee/<int:employee_id>/", views.delete_employee, name="delete_employee"),
    # path("api/roles/", views.get_roles, name="get_roles"),
    # path("api/statuses/", views.get_statuses, name="get_statuses"),
    path("api/edit-employee/<int:employee_id>/", views.edit_employee, name="edit_employee")
]
