# Generated by Django 5.1.5 on 2025-01-28 13:30

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_remove_employee_role_remove_employee_status_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='employee',
            name='role',
            field=models.ManyToManyField(blank=True, to='api.employeerole'),
        ),
        migrations.AddField(
            model_name='employee',
            name='status',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='api.employeestatus'),
        ),
    ]
