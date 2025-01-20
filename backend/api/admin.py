from django.contrib import admin
from .models import *

admin.site.register(Employee)
admin.site.register(EmployeeRole)
admin.site.register(EmployeeStatus)