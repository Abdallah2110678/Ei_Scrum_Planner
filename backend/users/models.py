from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from .managers import CustomUserManager


class User(AbstractBaseUser, PermissionsMixin):
    name = models.CharField(_("Name"), max_length=100)  # Combined name field
    specialist = models.CharField(_("Specialist"), max_length=100)  # Free-text input
    email = models.EmailField(_("Email Address"), max_length=254, unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name", "specialist"]

    objects = CustomUserManager()

    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")

    def __str__(self):
        return self.email

    @property
    def get_full_name(self):
        return self.name
