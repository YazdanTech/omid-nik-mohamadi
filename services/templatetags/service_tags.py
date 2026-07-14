from django import template

register = template.Library()

@register.filter
def split_by_comma(value):
    """Splits a comma-separated string into a list for template iteration."""
    if value:
        return [item.strip() for item in value.split(',')]
    return []