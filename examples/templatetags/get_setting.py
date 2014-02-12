from django import template
from django.conf import settings

register = template.Library()

@register.tag(name="get_setting")
def do_get_setting(parser, token):
    # split_contents() knows not to split quoted strings.
    tag_name, key = token.split_contents()
    return SettingNode(key)


class SettingNode(template.Node):
    def __init__(self, key):
        self.key = key
    def render(self, context):
        return getattr(settings, self.key)
