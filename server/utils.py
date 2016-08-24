import json

class HookWrapper:
    def __init__(self, method):
        self.hooks = []
        self.method = method

    def add_hook(self, hook):
        self.hooks.append(hook)

    def __call__(self, *args, **kwargs):
        saved = self.method(self.obj, *args, **kwargs)
        for hook in self.hooks:
            hook(self.obj, *args, **kwargs)
        return saved

    def __get__(self, obj, cls):
        self.obj = obj
        return self

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

WHITELIST_CLASSES = {}

def dumpable(cls):
    WHITELIST_CLASSES[cls.__name__] = cls
    return cls

class Dumper:
    @staticmethod
    def load_object(obj):
        if "_cls" in obj:
            if not obj["_cls"] in WHITELIST_CLASSES:
                print("{} is not in the whitelist".format(obj["_cls"]))
            return WHITELIST_CLASSES[obj["_cls"]]().__load__(obj["_data"])
        return obj

    @staticmethod
    def load(string):
        data = json.loads(string)
        return Dumper.traverse(data, Dumper.load_object, True)

    @staticmethod
    def dump_object(obj):
        if not obj.__class__.__name__ in WHITELIST_CLASSES:
            print("{} is not in the whitelist".format(obj.__class__.__name__))
        return {"_cls": obj.__class__.__name__, "_data": obj.__dump__()}

    @staticmethod
    def traverse(obj, hook, is_load):
        if isinstance(obj, dict):
            if is_load:
                obj = hook(obj)
            if isinstance(obj, dict):
                for key in obj:
                    obj[key] = Dumper.traverse(obj[key], hook, is_load)
            return obj
        elif isinstance(obj, (list, tuple)):
            obj = list(obj)
            for i in range(len(obj)):
                obj[i] = Dumper.traverse(obj[i], hook, is_load)
            return obj
        elif not isinstance(obj, (int, float, str)):
            return hook(obj)
        return obj

    @staticmethod
    def dump(data):
        return json.dumps(Dumper.traverse(data, Dumper.dump_object, False), separators=(',', ':'))
