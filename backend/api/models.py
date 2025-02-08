# from django.db import models
# from django.contrib.auth.models import User
# from django.contrib.auth.hashers import make_password


# #STAFF PROFILING ---------

# class EmployeeRole(models.Model):
#     role_name = models.CharField(max_length=50)

#     def __str__(self):
#         return self.role_name
    
# class EmployeeStatus(models.Model):
#     status_name = models.CharField(max_length=10) #ACTIVE/INACTIVE

#     def __str__(self):
#         return self.status_name
    
# class Employee(models.Model):
#     first_name = models.CharField(max_length=100)
#     last_name = models.CharField(max_length=100)
#     middle_initial = models.CharField(max_length=3, null=True, blank=True)
#     name_prefix = models.CharField(max_length=4, null=True, blank=True)  # JR/SR/II/IV
#     email = models.CharField(max_length=100)
#     username = models.CharField(max_length=100, null=True, blank=True)
#     passcode = models.CharField(max_length=128)  # Increase length to store hashed passcodes
#     contact = models.CharField(max_length=11)
#     base_salary = models.DecimalField(max_digits=8, decimal_places=2)

#     role = models.ManyToManyField(EmployeeRole, blank=True)
#     status = models.ForeignKey(EmployeeStatus, null=True, blank=True, on_delete=models.SET_NULL)    

#     def save(self, *args, **kwargs):
#         if not self.pk:
#             self.passcode = make_password(self.passcode)
#         super().save(*args, **kwargs)

#     def __str__(self):
#         return f"{self.first_name} {self.last_name}"

#     # def __str__(self):
#     #     full_name = f"{self.last_name}, {self.first_name}"
#     #     return full_name
    
#     # def save(self, *args, **kwargs):
#     #     if not self.user:  # Create a User instance if it doesn't exist
#     #         user = User.objects.create_user(
#     #             username=self.username,
#     #             password=self.passcode,
#     #             email=self.email,
#     #             first_name=self.first_name,
#     #             last_name=self.last_name
#     #         )
#     #         self.user = user
        
#     #     if self.role.filter(role_name='Admin').exists():
#     #         self.user.is_staff = True
#     #         self.user.is_superuser = True
#     #     else:
#     #         self.user.is_staff = False
#     #         self.user.is_superuser = False

#     #     self.user.save()
#     #     super().save(*args, **kwargs)


        
# # Generate a 6-digit numeric passcode
# # import random
# # passcode = f"{random.randint(100000, 999999)}"
# # Passcode.objects.create(code=passcode)