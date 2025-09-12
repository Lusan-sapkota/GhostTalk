from enum import Enum

class FriendRequestStatus(Enum):
    NO_REQUEST_SENT = 0
    THEM_SENT_TO_YOU = 1
    YOU_SENT_TO_THEM = 2