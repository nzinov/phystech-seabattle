def save_profile(backend, user, response, *args, **kwargs):
    if response.get('image') and response['image'].get('url'):
        user.avatar_url = response['image'].get('url')
    user.save()
