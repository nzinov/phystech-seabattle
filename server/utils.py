class HookWrapper:
    def __init__(self, method):
        self.hooks = []
        self.method = method

        def add_hook(self, hook):
            self.hooks.append(hook)

        def __call__(self, *args, **kwargs):
            saved = self.method(*args, **kwargs)
            for hook in self.hooks:
                hook(*args, **kwargs)
            return saved

def hooked(function):
    return HookWrapper(function)

ATTACHED_CALLBACKS = {
}

def attached(name):
    def decorator(func):
        if not name in ATTACHED_CALLBACKS:
            ATTACHED_CALLBACKS[name] = []
        ATTACHED_CALLBACKS[name].append(func)
        return func
    return decorator

def attachable(name):
    def decorator(func):
        def wrapper(*args, **kwargs):
            saved = func(*args, **kwargs)
            for el in ATTACHED_CALLBACKS[name]:
                el(*args, **kwargs)
            return saved
        return wrapper
    return decorator
