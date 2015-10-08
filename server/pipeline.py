import inspect

class PipelineFailure(Exception):
    def __init__(self, message):
        self.message = message
        super(PipelineFailure, self).__init__()

class PipelineFailedOr(Exception):
    def __init__(self, exceptions):
        self.exceptions = exceptions
        super(PipelineFailedOr, self).__init__()

class ContextKeyError(Exception):
    pass

class Context(dict):
    def __init__(self, **dictionary):
        super(Context, self).__init__(**dictionary)

    def __getattr__(self, attr):
        return self[attr]

    def __setattr__(self, attr, value):
        self[attr] = value

class Pipeline:
    def __init__(self, *pipeline):
        if isinstance(pipeline[0], list):
            pipeline = pipeline[0]
        self.pipeline = pipeline

    def __call__(self, **args):
        args = Context(**args)
        for group in self.pipeline:
            if isinstance(group, tuple):
                group_exceptions = []
                for el in group:
                    try:
                        el(args)
                    except PipelineFailure as exception:
                        group_exceptions.append(exception)
                    else:
                        break
                else:
                    raise PipelineFailedOr(group_exceptions)
            else:
                el = group
                el(args)
        return True

class unpack: #pylint: disable=invalid-name
    def __init__(self, *args):
        self.args = args
        self.wrapped = None

    def __call__(self, arg):
        if self.wrapped is None:
            self.wrapped = arg
            return self
        else:
            arg_names_list = inspect.signature(self.wrapped).parameters.keys()
            try:
                arguments = [arg[arg_name] for arg_name in arg_names_list]
            except KeyError:
                raise ContextKeyError()
            result = self.wrapped(*arguments)
            if isinstance(result, tuple):
                arg.update(result[1])
                result = result[0]
            return result

