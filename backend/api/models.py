from django.db import models
from django.contrib.auth.models import User

#STAFF PROFILING ---------

class EmployeeRole(models.Model):
    role_name = models.CharField(max_length=50)

    def __str__(self):
        return self.role_name
    
class EmployeeStatus(models.Model):
    status_name = models.CharField(max_length=10) #ACTIVE/INACTIVE

    def __str__(self):
        return self.status_name
    
class Employee(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_initial = models.CharField(max_length=3, null=True, blank=True)
    name_prefix = models.CharField(max_length=4, null=True, blank=True) #JR/SR/II/IV
    email = models.CharField(max_length=100)
    username = models.CharField(max_length=100, null=True, blank=True)
    passcode = models.CharField(max_length=6)
    contact = models.CharField(max_length=11)
    base_salary = models.DecimalField(max_digits=8, decimal_places=2)

    role = models.ManyToManyField(EmployeeRole, blank=True)
    status = models.ForeignKey(EmployeeStatus, on_delete = models.CASCADE)    

    def __str__(self):
        full_name = f"{self.last_name}, {self.first_name}"
        return full_name
    
# Generate a 6-digit numeric passcode
# import random
# passcode = f"{random.randint(100000, 999999)}"
# Passcode.objects.create(code=passcode)