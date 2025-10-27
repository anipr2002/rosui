def get_typedef(type_name):
"""
Get the typedef for a message type.

    A typedef is a dict containing the following fields:
        - string type
        - string[] fieldnames
        - string[] fieldtypes
        - int[] fieldarraylen
        - string[] examples
        - string[] constnames
        - string[] constvalues

    get_typedef will return a typedef dict for the specified message type.
    """
    if not type_name:
        return None
    # Check if the type string indicates a sequence (array) type
    if matches := re.findall("sequence<([^<]+)>", type_name):
        # Extract the inner type and continue processing
        type_name = matches[0]

    if type_name in atomics:
        # Atomics don't get a typedef
        return None

    if type_name in specials:
        # Specials get their type def mocked up
        return _get_special_typedef(type_name)

    # Fetch an instance and return its typedef
    try:
        instance = ros_loader.get_message_instance(type_name)
        return _get_typedef(instance)
    except (ros_loader.InvalidModuleException, ros_loader.InvalidClassException) as e:
        logger.error("An error occurred trying to get the type definition for %s: %s", type_name, e)
        return None

def get_service_request_typedef(servicetype):
"""Return a typedef dict for the service request class for the specified service type.""" # Get an instance of the service request class and return its typedef
if not servicetype:
return None
instance = ros_loader.get_service_request_instance(servicetype)
return \_get_typedef(instance)

def get_service_response_typedef(servicetype):
"""Return a typedef dict for the service response class for the specified service type.""" # Get an instance of the service response class and return its typedef
if not servicetype:
return None
instance = ros_loader.get_service_response_instance(servicetype)
return \_get_typedef(instance)

def get_typedef_recursive(type_name):
"""Return a list of typedef dicts for this type and all contained type fields.""" # Just go straight into the recursive method
if not type_name:
return []
return \_get_typedefs_recursive(type_name, [])

def get_service_request_typedef_recursive(servicetype):
"""Return a list of typedef dicts for this type and all contained type fields.""" # Get an instance of the service request class and get its typedef
if not servicetype:
return []
instance = ros_loader.get_service_request_instance(servicetype)
typedef = \_get_typedef(instance)

    # Return the list of sub-typedefs
    return _get_subtypedefs_recursive(typedef, [])

def get_service_response_typedef_recursive(servicetype):
"""Return a list of typedef dicts for this type and all contained type fields.""" # Get an instance of the service response class and get its typedef
if not servicetype:
return []
instance = ros_loader.get_service_response_instance(servicetype)
typedef = \_get_typedef(instance)

    # Return the list of sub-typedefs
    return _get_subtypedefs_recursive(typedef, [])

def get_action_goal_typedef_recursive(actiontype):
"""Return a list of typedef dicts for this type and all contained type fields.""" # Get an instance of the action goal class and get its typedef
if not actiontype:
return []
instance = ros_loader.get_action_goal_instance(actiontype)
typedef = \_get_typedef(instance)

    # Return the list of sub-typedefs
    return _get_subtypedefs_recursive(typedef, [])

def get_action_result_typedef_recursive(actiontype):
"""Return a list of typedef dicts for this type and all contained type fields.""" # Get an instance of the action result class and get its typedef
if not actiontype:
return []
instance = ros_loader.get_action_result_instance(actiontype)
typedef = \_get_typedef(instance)

    # Return the list of sub-typedefs
    return _get_subtypedefs_recursive(typedef, [])

def get_action_feedback_typedef_recursive(actiontype):
"""Return a list of typedef dicts for this type and all contained type fields.""" # Get an instance of the action feedback class and get its typedef
if not actiontype:
return []
instance = ros_loader.get_action_feedback_instance(actiontype)
typedef = \_get_typedef(instance)

    # Return the list of sub-typedefs
    return _get_subtypedefs_recursive(typedef, [])
