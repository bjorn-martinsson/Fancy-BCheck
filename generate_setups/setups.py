import struct

DATA = {
    "Launcher" : [
        "Stock",    0, "STOCK",   "Uses the stock rocket launcher.",
        "Original", 0, "ORIG",    "Uses the original rocket launcher.",
        "Mangler",  0, "MANG",    "Uses the cow mangler rocket launcher.",
    ],

    "Type of bounce" : [
        "Bounce",   0, "BOUNCE",  "Crouched bounce setup, meaning you can use a rocket to \"bounce\" the moment you land. Requires teleheight < 2.0 units.",
        "Bhop",     0, "BHOP",    "Bhop (bounce hop) setup, meaning you can jump the moment you land. It is also possible to do standing bounce with same setup. Requires teleheight < 2.0 units.",
        "Jumpbug",  0, "JB",      "Jumpbug setup, meaning you can jump the moment you land if you release crouch and jump at the same exact time. Requires teleheight < TODO.",
    ],

    "Complexity" : [ 
        "Simple",             60, "SIMPLE",    "Setups that are simple. Requiring few/no binds, few inputs, and few rockets.",
        "Consistency",        2,  "CONIST",    "Setups avoiding diagonal movement, which can be inconsistent without a bind. Also prefer bounce setups where the timing window for hitting the bounce is large.",
        "No bind required",   10, "NOBIND",    "Setups that use no binds.",
    ],

    "Automatic bounce" : [
        "Auto bounce",                   10, "ABOUNCE",         "Can be bounced by only holding m1. Note that some setups require aiming straight down (fully automatic), and others require aiming forward (half automatic).",
        "Auto synced bounce",            5, "ASBOUNCE",        "It is possible to prefire a rocket for a synced bounce only holding m1. Note that some setups require aiming straight down (fully automatic), and others require aiming forward (half automatic).",
        "Auto standing bounce",          10, "ASTANDBOUNCE",    "Can be standing bounced by only holding m1. Perfect setup if you want to go straight into a pogo. Note that some setups require aiming straight down (fully automatic), and others require aiming forward (half automatic).",
        "Auto synced standing bounce",   0,  "ASSTANDBOUNCE",   "It is possible to prefire a rocket for a synced standing bounce only holding m1. Note that some setups require aiming straight down (fully automatic), and others require aiming forward (half automatic).",
    ],

    "Fully automatic bounce" : [
        "Fully auto bounce",                   20, "FABOUNCE",         "Can be bounced by only holding m1 and looking straight down. The rocket explodes the tick the player hits the ground.",
        "Fully auto synced bounce",            10, "FASBOUNCE",        "It is possible to prefire a rocket straight down for a synced bounce only holding m1. The rocket explpodes the tick the player hits the ground.",
        "Fully auto standing bounce",          20, "FASTANDBOUNCE",    "Can be standing bounced by only holding m1 and looking straight down. The rocket explodes the tick the player hits the ground. Perfect setup if you want to go straight into a pogo.",
        "Auto synced standing bounce",   0,  "FASSTANDBOUNCE",   "It is possible to prefire a rocket for a synced standing bounce only holding m1 looking straight down. The rocket explodes the tick the player hits the ground.",
    ],

    "Trajectory" : [
        "Height",       1, "HEIGHT",  "The heighest point your feet reach during the setup.",
        "Distance",     1, "DIST",    "The horizontal distance traversed from leaving the initial platform to hitting the bounce/bhop/powerbounce.",
        "Speed",        1, "SPEED",   "The horizontal speed when leaving the initial platoform. This is often maximized by multi-rocket setups that hit a speedshot.",
        "Compact",      1, "COMPACT", "The horizontal distance traversed on the initial platform. This can be used to avoid setups that require large amount of space.",
        "Quick",        1, "QUICK",   "The time taken from the start of the setup to hitting the bounce/bhop/jumpbug."
    ],

    "Advanced bounce" : [
        "Standing bounce",             2, "STANDBBOUNCE", "Setups where you have time to fire a rocket in order to do a standing bounce.",
        "Power bounce",                2, "PB",           "Setups where you can both bhop and have time to shoot a rocket in order to do a \"power bounce\".",
        "Jumpbug power bounce",        0, "JBPB",         "Setups where you can both jumpbug and have time to shoot a rocket in order to do a \"jumpbug power bounce\".",
        "Synced bounce",               2, "SBOUNCE",      "Setups where you have time to prefire a rocket in order to perform a synced bounce.",
        "Synced powerbounce",          2, "SPB",          "Setups where you have time to prefire a rocket in order to perform a synced power bounce,",
        "Synced jumpbug powerbounce",  0, "SJBPB",        "Setups where you have time to prefire a rocket in order to perform a synced jumpbug power bounce.",
        "Synced standing bounce",               0, "SSTANDBOUNCE",      "Setups where you have time to prefire a rocket in order to perform a synced standing bounce.",
    ],

    "Movement" : [
        "Crouched start",      0,  "CROUCHED",         "Setups starting with being crouched. May not be preferable because of low horizontal speed.",
        "Non-moving starts",   2,  "NOMOVING",         "Setups where you do not press any movement keys. May be preferable because of consistency.",
        "Diagonal movement",   -2, "DIAGONAL",         "Setups with diagonal movement, which, unless a bind is used, may be inconsistent.",
        "+moveup",             0,  "MOVEUP",           "Setups involving the +moveup command. This allows the player to accelerate/walk slower.",
        "+strafe",             0,  "STRAFE",           "Setups involving +strafe together with +left or +right. This allows the player to walk in directions/speeds that are otherwise impossible.",
        "No bind required",    2,  "NOMOVEMENTBIND",   "Setups that can be performed using just WASD. Note that a bind might still be preferable for consistency in the case of diagonal movement.",
    ],

    "Action" : [
        "Quickswap",            0,   "SHOTGUN",        "Setups that start by quickswapping to delay the first rocket. The player needs to be holding a different weapon than their rocket launcher for this to work.",
        "Rocketless setup",     0,   "ZEROROCKET",     "Setups that involve no rockets in the initial action. Note that setups may still require rockets to hit for example a bounce.",
        "1 Rocket setup",       2,   "ONEROCKET",      "Setups that use exactly 1 rocket. (Excluding any rocket used to hit a bounce).",
        "Jump shoot",           0,   "JS",             "Setups that start with a \"Jump shot\", shooting and jumping at the same time.",
        "Jump duck shoot",      0,   "JDS",            "Setups that start with a \"Jump duck shot\", shooting and crouched jumping at the same time.",
        "Ctap jump duck shoot", 0,   "CTAP_JDS",       "Setups that start with a \"CTAP jump duck shot\", shooting and ctap jumping at the same time. This is preferable to maximize height.",
        "Shoot 1 tick early",   -1000, "ONETICK",        "CTAP JDS setups that require manually shooting a rocket 1 tick before performing the CTAP, resulting in more height and speed.",
        "Shoot 2 ticks early",  -1000, "TWOTICK",        "CTAP JDS setups that require manually shooting a rocket 2 ticks before performing the CTAP, resulting in the most powerful CTAP possible. Useful for jumps like jump_diabarha last.",
        "No bind required",     1,   "NOACTIONBIND",   "Setups that only involve jumping or firing a rocket.",
    ],
}

#const FLAG_NAMES = [
#
#    "STOCK",
#    "ORIG",
#    "MANG",
#    "BOUNCE",
#    "BHOP",
#    "JB",
#    "SIMPLE",
#    "CONIST",
#    "NOBIND",
#    "ABOUNCE",
#    "ASBOUNCE",
#    "ASTANDBOUNCE",
#    "ASSTANDBOUNCE",
#    "FABOUNCE",
#    "FASBOUNCE",
#    "FASTANDBOUNCE",
#    "FASSTANDBOUNCE",
#    "HEIGHT",
#    "DIST",
#    "SPEED",
#    "COMPACT",
#    "QUICK",
#    "STANDBOUNCE",
#    "PB",
#    "JBPB",
#    "SBOUNCE",
#    "SPB",
#    "SJBPB",
#    "SSTANDBOUNCE",
#    "CROUCHED",
#    "NOMOVING",
#    "DIAGONAL",
#    "MOVEUP",
#    "STRAFE",
#    "NOMOVEMENTBIND",
#    "SHOTGUN",
#    "ZEROROCKET",
#    "ONEROCKET",
#    "JS",
#    "JDS",
#    "CTAP_JDS",
#    "ONETICK",
#    "TWOTICK",
#    "NOACTIONBIND"
#
#];
#

preferences = []
item_ids = []
for group_name in DATA:
    items = DATA[group_name]
    num_items = len(items)//4

    group_items = []
    group_dict = {"name":group_name, "preferences":group_items}
    for i in range(num_items):
        item_name, item_default_weight, item_id, item_description = items[4 * i: 4 * i + 4]
        group_items.append({"id":item_id, "label":item_name, "defaultWeight":item_default_weight, "description":item_description})
        item_ids.append(item_id)
    preferences.append({'name':group_name, 'preferences':group_items})

preferencesJSON = {'groups':preferences}
# JSON descrbing preferences
import json
y = json.dumps(preferencesJSON, indent=4)


if __name__ == "__main__":
    print(y)


class Setup:
    my_hash = tuple() # Hash to destiguish setups

    ID = -1
    launcher = -1
    start_moving = -1
    start_action = -1
    num_rockets = -1
    tick_delay_auto_bounce = -1
    tick_delay_auto_synced_bounce = -1
    tick_delay_auto_standing_bounce = -1
    tick_delay_auto_synced_standing_bounce = -1

    def __init__(self):
        self.speeds = []
        for item_id in item_ids:
            self.__dict__[item_id] = 0

    def pack(self):

        while len(self.speeds) < 7:
            self.speeds.append(0.0)
        assert len(self.speeds) == 7

        mask8 = 2**8 - 1
        mask32 = 2**32 - 1
        mask64 = 2**64 - 1

        assert 0 <= self.launcher & mask8 < 3
        assert 0 <= self.start_moving & mask8 < 28
        assert 0 <= self.start_action & mask8 < 10
        assert 0 <= self.num_rockets & mask8 < 7

        data = [self.ID & mask64, self.launcher & mask8, self.start_moving & mask8, self.start_action & mask8, self.num_rockets & mask8]

        data += [self.tick_delay_auto_bounce & mask8, self.tick_delay_auto_synced_bounce & mask8, self.tick_delay_auto_standing_bounce & mask8, self.tick_delay_auto_synced_standing_bounce & mask8]

        for item_id in item_ids:
            data.append(self.__dict__[item_id] & mask8)
        data += [round(100 * v) & mask32 for v in self.speeds]

        record = struct.pack(
            f"<Q{8 + len(item_ids)}B7I",
            *data
        )

        return record
    
    def __str__(self):
        out = []
        
        VARs = ["ID", "launcher", "start_moving", "start_action", "num_rockets", "tick_delay_auto_bounce", "tick_delay_auto_synced_bounce"]
        VARs+= ["tick_delay_auto_standing_bounce", "tick_delay_auto_synced_standing_bounce", "speeds"]

        for var in VARs:
            out.append("%s = %s" % (var, getattr(self, var)))

        for item_id in item_ids:
            out.append("%s = %s" % (item_id, self.__dict__[item_id]))

        return '\n'.join(out) 

#out = []
#
#obj = Setup()
#
#obj.launcher = 2
#obj.ID = 1234
#obj.num_rockets = 0
#obj.start_moving = 5
#obj.start_action = 7
#obj.speeds[0] = 102.32
#obj.speeds[1] = 103.33
#out.append(obj.pack())
#obj.launcher = 2
#obj.ID = 1234
#obj.num_rockets = 6
#obj.start_moving = 3
#obj.start_action = 4
#obj.speeds[0] = 102.32
#obj.speeds[1] = 103.33
#obj.speeds[1] = 102.33
#obj.FASSTANDBOUNCE = 0
#obj.tick_delay_auto_synced_standing_bounce = 13
#out.append(obj.pack())

def export_setups(setups, height):
    print('Saving %d setups for height %d into file ../data/%d.bin' % (len(setups), height, height))
    out = [setup.pack() for setup in setups]
    with open('../data/%d.bin' % height, 'wb') as f:
        for data in out:
            f.write(data)
