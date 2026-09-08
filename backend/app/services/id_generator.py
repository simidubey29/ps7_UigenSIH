_counter = 2000000000


def generate_field_id():
    global _counter
    _counter += 1
    return str(_counter)

generate_field_id()
