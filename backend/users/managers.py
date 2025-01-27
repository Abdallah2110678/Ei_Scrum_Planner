from django.contrib.auth.base_user import BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.core.validators import validate_email
from django.core.exceptions import ValidationError


class CustomUserManager(BaseUserManager):

    def email_validator(self, email):
        try:
            validate_email(email)
        except ValidationError:
            raise ValueError(_("You must provide a valid email"))

    def create_user(self, name, specialist, email, password=None, **extra_fields):
        if not name:
            raise ValueError(_("Users must submit a name"))

        if not specialist:
            raise ValueError(_("Users must submit a specialist"))

        if email:
            email = self.normalize_email(email)
            self.email_validator(email)
        else:
            raise ValueError(_("Base User: An email address is required"))

        user = self.model(
            name=name,
            specialist=specialist,
            email=email,
            **extra_fields
        )

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, name, specialist, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_("Superuser: An email address is required"))

        if not password:
            raise ValueError(_("Superuser: A password is required"))

        user = self.create_user(name, specialist, email, password, **extra_fields)
        user.save(using=self._db)
        return user
