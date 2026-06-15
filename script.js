const SCALE = [
    -10000,
    -6775,
    -4191,
    -2594,
    -1607,
    -1000,
    -620,
    -387,
    -243,
    -154,
    -100,
    -65,
    -44,
    -31,
    -23,
    -18,
    -15,
    -13,
    -12,
    -11,
    -10,
    -9,
    -8,
    -7,
    -6,
    -5,
    -4,
    -3,
    -2,
    -1,

     0,

     1,
     2,
     3,
     4,
     5,
     6,
     7,
     8,
     9,
     10,
     11,
     12,
     13,
     15,
     18,
     23,
     31,
     44,
     65,
     100,
     154,
     243,
     387,
     620,
     1000,
     1607,
     2594,
     4191,
     6775,
     10000,
];

let preferencesConfig = null;
let currentResults = [];

async function loadData() {
    
    const prefResponse =
        await fetch(
            "preferences.json"
        );

    preferencesConfig =
        await prefResponse.json();

    buildPreferences();

}

loadData();

function togglePreferences() {

    document
        .getElementById(
            "preferencesPanel"
        )
        .classList
        .toggle("hidden");

}

function nearestScaleIndex(value) {

    let bestIndex = 0;
    let bestDistance = Infinity;

    SCALE.forEach(
        (scaleValue, index) => {

            const distance =
                Math.abs(
                    scaleValue
                    - value
                );

            if (
                distance <
                bestDistance
            ) {

                bestDistance =
                    distance;

                bestIndex =
                    index;

            }

        }
    );

    return bestIndex;

}

function buildPreferences() {

    const container =
        document.getElementById(
            "preferences"
        );

    container.innerHTML = "";

    preferencesConfig.groups
        .forEach(group => {

        const groupDiv =
            document.createElement(
                "div"
            );

        groupDiv.className =
            "preference-group";

        groupDiv.innerHTML =
            `<h3>${group.name}</h3>`;

        group.preferences
            .forEach(pref => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "slider-row";

            row.innerHTML = `

                <label>

                    ${pref.label}
                    
                    <span class="tooltip-container">

                        ⓘ

                        <span class="tooltip">
                            ${pref.description || ""}
                        </span>

                    </span>

                </label>

                <input
                    type="range"
                    min="0"
                    max="${SCALE.length - 1}"
                    value="${nearestScaleIndex(pref.defaultWeight ?? 0)}"
                    id="${pref.id}Slider">

                <input
                    type="number"
                    value="${pref.defaultWeight ?? 0}"
                    id="${pref.id}Number">

            `;

            groupDiv.appendChild(
                row
            );

        });

        container.appendChild(
            groupDiv
        );

    });

    initializePreferenceLogic();

}

function initializePreferenceLogic() {

    preferencesConfig.groups
        .forEach(group => {

        group.preferences
            .forEach(pref => {

            const slider =
                document.getElementById(
                    `${pref.id}Slider`
                );

            const number =
                document.getElementById(
                    `${pref.id}Number`
                );

            const defaultValue =
                pref.defaultWeight ?? 0;

            const saved =
                localStorage.getItem(
                    pref.id
                );

            if (
                saved !== null
            ) {

                number.value =
                    saved;

                slider.value =
                    nearestScaleIndex(
                        Number(saved)
                    );

            }
            else {

                number.value =
                    defaultValue;

                slider.value =
                    nearestScaleIndex(
                        defaultValue
                    );

            }

            slider.addEventListener(
                "input",
                () => {

                const value =
                    SCALE[
                        Number(
                            slider.value
                        )
                    ];

                number.value =
                    value;

                localStorage.setItem(
                    pref.id,
                    value
                );

                rerankResults();

            });

            number.addEventListener(
                "input",
                () => {

                const value =
                    Number(
                        number.value
                    );

                slider.value =
                    nearestScaleIndex(
                        value
                    );

                localStorage.setItem(
                    pref.id,
                    value
                );

                rerankResults();

            });

        });

    });

}

function resetPreferences() {

    preferencesConfig.groups
        .forEach(group => {

        group.preferences
            .forEach(pref => {

            const value =
                pref.defaultWeight ?? 0;

            localStorage.removeItem(
                pref.id
            );

            document.getElementById(
                `${pref.id}Number`
            ).value =
                value;

            document.getElementById(
                `${pref.id}Slider`
            ).value =
                nearestScaleIndex(
                    value
                );

        });

    });

    rerankResults();

}

function getWeights() {

    const weights = {};

    preferencesConfig.groups
        .forEach(group => {

        group.preferences
            .forEach(pref => {

            weights[pref.id] =
                Number(
                    document
                    .getElementById(
                        `${pref.id}Number`
                    )
                    .value
                );

        });

    });

    return weights;

}

function scoreSetup(setup) {

    const weights =
        getWeights();

    let score = 0;

    Object.keys(weights)
        .forEach(key => {

        score +=

            (setup[key] || 0)

            *

            weights[key];

    });

    return score;

}


async function findSetups() {

    // 1. Get the input and convert it to an integer
    const inputVal = parseInt(document.getElementById("targetInput").value, 10);

    // 2. Perform the efficient modulo reduction
    const finalNumber = inputVal > 8000 
        ? 7000 - ((8000 - inputVal) % 105) // Player is falling at terminal velocity
        : inputVal;

    // 3. Convert it back to a string
    const target = finalNumber.toString();

    currentResults =
        await loadHeight(
            target
        );

    rerankResults();

}

function rerankResults() {

    currentResults.sort(
        (a, b) =>
            scoreSetup(b)
            -
            scoreSetup(a)
    );

    displayResults();

}

function displayResults() {

    const container =
        document.getElementById(
            "results"
        );

    container.innerHTML = "";

    if (
        currentResults.length === 0
    ) {

        container.innerHTML =
            "<p>No setups found.</p>";

        return;

    }
    
    currentResults.forEach(
        setup => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "setup";

            const techniqueTags =
                buildTechniqueTags(
                    setup
                );

            const speedSection =
                buildRocketSpeedSection(
                    setup
                );

            const allCode =
                setup.binds
                    .map(
                        bind =>
                            bind.code
                    )
                    .join(
                        "\n"
                    );

            const bindsSection =
                buildBindsSection(
                    setup
                );

            const codeBlock =
                setup.binds
                    .map(
                        bind => `${bind.code}`
                    )
                    .join(
                        "\n"
                    );

            div.innerHTML = `
                
                <h4>
                    Setup #${setup.id}
                    <br>
                    <small>with preference score ${scoreSetup(setup)}</small>
                </h4>

                <div class="tag-row">

                    ${techniqueTags}

                </div> 

                ${bindsSection}

                <details>

                    <summary>
                        Show bind
                    </summary>

                    <pre class="alias-code">${allCode}</pre>

                </details>

                <button
                    class="copy-button">

                    Copy bind

                </button>

                <h4>
                    Initial hspeed and hspeed after each rocket hits
                </h4>

                <div>

                    ${speedSection}

                </div>

            `;


            div
            .querySelector(
                ".copy-button"
            )
            .addEventListener(
                "click",
                () => {

                    copyText(
                        allCode
                    );

                }
            );


            container.appendChild(
                div
            );

        }
    );

}

function launcherDescription(type) {

    const map = {

        stock:
            "Uses the stock rocket launcher.",

        original:
            "Uses the Original.",

        mangler:
            "Uses the Cow Mangler.",
        
        "any launcher":
            "Can be done with any launcher."

    };

    return map[type];
}

function launcherClass(
    launcher
) {

    switch (launcher) {

        case "stock":
            return "launcher-stock";

        case "original":
            return "launcher-original";

        case "mangler":
            return "launcher-mangler";

        case "any launcher":
            return "launcher-any"

        default:
            return "";

    }

}

function launcherTagType(
    launcher
) {

    switch (launcher) {

        case "stock":
            return "launcher-stock";

        case "original":
            return "launcher-original";

        case "mangler":
            return "launcher-mangler";

        case "any launcher":
            return "launcher-any";

        default:
            return "";
    }

}

function buildLauncherTag(
    launcher
) {
    return createTag(

        capitalizeFirstLetter(launcher),

        {
            description:
                launcherDescription(
                    launcher
                ),

            type:
                launcherTagType(
                    launcher
                )
        }

    );

}

function buildTechniqueTags(setup) {

    const tags = [];

    const techniques =
        setup.techniques;

    const launcherTag =
    buildLauncherTag(
        setup.launcher
    );
    tags.push(launcherTag);

    const rocketTag =
        createTag(
            `${setup.rocketCount} rocket${setup.rocketCount != 1 ? "s" : ""}`,
            {
                description:
                    "Number of rockets used.",

                type:
                    "rocket-tag"
            }
        );
    tags.push(rocketTag);


    if (
        techniques.bhop?.possible
    ) {

        tags.push(
            createTag(
                "Bhop",
                {
                    description:
                        "Bhop (and jumpbug) is possible.",

                    type:
                        "technique-tag"
                }
            )
        );

    }
    else if (
        techniques.jumpbug?.possible
    ) {
        tags.push(
            createTag(
                "Jumpbug",
                {
                    description:
                        "Jumpbug is possible.",

                    type:
                        "technique-tag"
                }
            )
        );
    }
    
    if (
        techniques.bounce?.possible
    ) {

        if (techniques.bounce.automatic) {
            if (techniques.bounce.fullyAutomatic) {
                tags.push(
                    createTag(
                        "Bounce (Fully auto)",
                        {
                            description:
                                "Holding m1 (while looking straight down) results in firing a rocket that can be used to hit a crouched bounce.",

                            type:
                                "technique-fullyAuto"
                        }
                    )
                );

            } else {
                tags.push(
                    createTag(
                        "Bounce (Auto)",
                        {
                            description:
                                "Holding m1 results in firing a rocket that can be to hit a crouched bounce. However, this may require accurately aiming the rocket.",

                            type:
                                "technique-auto"
                        }
                    )
                );

            }
        } else {
            tags.push(
                createTag(
                    "Bounce",
                    {
                        description:
                            "It is possible to fire a rocket to hit a crouched bounce, but it will require manually timing/aiming the rocket.",

                        type:
                            "technique-tag"
                    }
                )
            );

        }

    }

    if (
        techniques.standingBounce?.possible
    ) {
        if (techniques.standingBounce.automatic) {
            if (techniques.standingBounce.fullyAutomatic) {
                tags.push(
                    createTag(
                        "Standing bounce (Fully auto)",
                        {
                            description:
                                "Holding m1 (while looking straight down) results in firing a rocket that can be used to hit a standing bounce.",

                            type:
                                "technique-fullyAuto"
                        }
                    )
                );

            } else {
                tags.push(
                    createTag(
                        "Standing bounce (Auto)",
                        {
                            description:
                                "Holding m1 results in firing a rocket that can be to hit a standing bounce. However, this may require accurately aim the rocket.",

                            type:
                                "technique-auto"
                        }
                    )
                );

            }
        } else {
            tags.push(
                createTag(
                    "Standing bounce",
                    {
                        description:
                            "It is possible to fire a rocket to hit a standing bounce, but it will require manually timing/aiming the rocket.",

                        type:
                            "technique-tag"
                    }
                )
            );

        }

    }

    if (
        techniques.syncedBounce?.possible
    ) {
        if (techniques.syncedBounce.automatic) {
            if (techniques.syncedBounce.fullyAutomatic) {
                tags.push(
                    createTag(
                        "Synced bounce (Fully auto)",
                        {
                            description:
                                "Holding m1 (while looking straight down) results in prefiring a rocket that can be used to hit a crouched bounce/synced bounce.",

                            type:
                                "technique-fullyAuto"
                        }
                    )
                );

            } else {
                tags.push(
                    createTag(
                        "Synced bounce (Auto)",
                        {
                            description:
                                "Holding m1 results in prefiring a rocket that can be to hit a crouched bounce/synced bounce. However, this may require accurately aiming the prefire.",

                            type:
                                "technique-auto"
                        }
                    )
                );

            }
        } else {
            tags.push(
                createTag(
                    "Synced bounce",
                    {
                        description:
                            "It is possible to prefire a rocket to hit a synced bounce, but it will require manually timing/aiming the prefire.",

                        type:
                            "technique-tag"
                    }
                )
            );

        }

    }

    return tags.join("");

}

function createTag(
    text,
    options = {}
) {

    return `
        <span
            class="tag ${options.type || ""} tooltip-container">

            ${text}

            <span class="tooltip">

                ${options.description || ""}

            </span>

        </span>
    `;
}

function buildRocketSpeedSection(
    setup
) {

    return setup.rocketSpeeds
        .map(
            (speed, index) =>
            
            index == 0 ?
            `<span
                class="speed-badge">

                Initial:
                ${speed}
                u/s

            </span>` 
            :
            `<span
                class="speed-badge">

                R<sub>${index}</sub>:
                ${speed}
                u/s

            </span>` 
        )
        .join("");

}

function copyText(text) {

    navigator.clipboard
        .writeText(text);

}

function capitalizeFirstLetter(str) {
    if (!str) return str; // Handles empty strings safely
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function buildBindsSection(
    setup
) {

    return setup.binds
        .map(
            bind =>

            `

            <div
                class="bind-card">
                
                <span
                    class="tooltip-container">

                    ⓘ

                    <span
                        class="tooltip">

                        ${bind.description}

                    </span>

                </span>

                ${bind.name}

            </div>

            `
        )
        .join("");

}


// Note, same flag names are also in preference.json
const FLAG_NAMES = [

    "STOCK",
    "ORIG",
    "MANG",
    "BOUNCE",
    "BHOP",
    "JB",
    "SIMPLE",
    "CONIST",
    "NOBIND",
    "ABOUNCE",
    "ASBOUNCE",
    "ASTANDBOUNCE",
    "ASSTANDBOUNCE",
    "HEIGHT",
    "DIST",
    "SPEED",
    "COMPACT",
    "QUICK",
    "STANDBOUNCE",
    "PB",
    "JBPB",
    "SBOUNCE",
    "SPB",
    "SJBPB",
    "CROUCHED",
    "NOMOVING",
    "DIAGONAL",
    "MOVEUP",
    "STRAFE",
    "NOMOVEMENTBIND",
    "SHOTGUN",
    "0ROCKET",
    "1ROCKET",
    "JS",
    "JDS",
    "CTAP JDS",
    "1TICK",
    "2TICK",
    "NOACTIONBIND"

];

const RECORD_SIZE = 79;

function decodeSetup(view, offset) {

    // Decode binary data

    let cursor = offset;

    const setup = {};

    setup.ID =
        view.getBigUint64(
            cursor,
            true
        );

    cursor += 8;

    setup.launcher =
        view.getUint8(cursor++);

    setup.start_moving =
        view.getUint8(cursor++);

    setup.start_action =
        view.getUint8(cursor++);

    setup.num_rockets =
        view.getUint8(cursor++);

    for (const flag of FLAG_NAMES) {

        setup[flag] =
            view.getUint8(
                cursor++
            );

    }

    setup.speeds = [];

    for (let i = 0; i < setup.num_rockets + 1; i++) {

        setup.speeds.push(

            view.getUint32(
                cursor,
                true
            ) / 100

        );

        cursor += 4;

    }

    // Create JSON structure
    
    // id
    setup.id = setup.ID;

    // launcher
    if (setup.num_rockets == 0) {
        setup.launcher = "any launcher";
    } else {
        switch (setup.launcher) {
            case 0:
                setup.launcher = "stock";
                break;
            case 1:
                setup.launcher = "original";
                break;
            case 2:
                setup.launcher = "mangler";
                break;
        }
    }

    // rocketCount, rocketSpeeds
    setup.rocketCount = setup.num_rockets;
    setup.rocketSpeeds = setup.speeds;
    
    // techniques:
    // bounce
    setup.techniques = {};
    setup.techniques.bounce = {
        possible: false,
        automatic: false
    }
    if (setup.BOUNCE >= 128) {
        setup.techniques.bounce.possible = true;
        if (setup.ABOUNCE >= 128) {
            setup.techniques.bounce.automatic = true;
            if (setup.ABOUNCE >= 200) {
                setup.techniques.bounce.fullyAutomatic = true;
            }
        }
    }

    // synced bounce
    setup.techniques.syncedBounce = {
        possible: false,
        automatic: false
    }
    if (setup.SBOUNCE >= 128) {
        setup.techniques.syncedBounce.possible = true;
        if (setup.ASBOUNCE >= 128) {
            setup.techniques.syncedBounce.automatic = true;
            if (setup.ASBOUNCE >= 200) {
                setup.techniques.syncedBounce.fullyAutomatic = true;
            }
        }
    }

    // standing bounce
    setup.techniques.standingBounce = {
        possible: false,
        automatic: false
    }
    if (setup.STANDBOUNCE >= 128) {
        setup.techniques.standingBounce.possible = true;
        if (setup.ASTANDBOUNCE >= 128) {
            setup.techniques.standingBounce.automatic = true;
            if (setup.ASTANDBOUNCE >= 128) {
                setup.techniques.standingBounce.fullyAutomatic = true;
            }
        }
    }

    // Bhop
    // standing bounce
    setup.techniques.bhop = {
        possible: false,
    }
    if (setup.BHOP >= 128) {
        setup.techniques.bhop.possible = true;
    }
    
    // jumpbug
    // standing bounce
    setup.techniques.jumpbug = {
        possible: false,
    }
    if (setup.JB >= 128) {
        setup.techniques.jumpbug.possible = true;
    }


    // name
    // description
    // code
    moving_bind = {}
    
    if (setup.start_action != 1) {
        // uncrouched starts
        switch (setup.start_moving) {
            case 0:
                moving_bind.name = "Stand still.";
                moving_bind.description = "Start uncrouched, not moving.";
                moving_bind.code = "alias +walk \"\";\nalias -walk \"\";";
                break;
            case 1:
                moving_bind.name = "Walk forward.";
                moving_bind.description = "Start walking forwards while uncrouched.";
                moving_bind.code = "alias +walk \"+forward\";\nalias -walk \"-forward -1\";";
                break;
            case 2:
                moving_bind.name = "Walk back.";
                moving_bind.description = "Start walking backwards while uncrouched.";
                moving_bind.code = "alias +walk \"+back\";\nalias -walk \"-back -1\";";
                break;
            case 3:
                moving_bind.name = "Walk left.";
                moving_bind.description = "Start walking left while uncrouched.";
                moving_bind.code = "alias +walk \"+moveleft\";\nalias -walk \"-moveleft -1\";"
                break;
            case 4:
                moving_bind.name = "Walk right.";
                moving_bind.description = "Start walking right while uncrouched.";
                moving_bind.code = "alias +walk \"+moveright\";\nalias -walk \"-moveright -1\";";
                break;
            case 5:
                moving_bind.name = "Walk forward + left.";
                moving_bind.description = "Start walking diagonally forwards + left while uncrouched.";
                moving_bind.code = "alias +walk \"+forward; +moveleft\";\nalias -walk \"-forward -1; -moveleft -1\";";
                break;
            case 6:
                moving_bind.name = "Walk forward + right.";
                moving_bind.description = "Start walking diagonally forwards + right while uncrouched.";
                moving_bind.code = "alias +walk \"+forward; +moveright\";\nalias -walk \"-forward -1; -moveright -1\";";
                break;
            case 7:
                moving_bind.name = "Walk back + left.";
                moving_bind.description = "Start walking diagonally backwards + left while uncrouched.";
                moving_bind.code = "alias +walk \"+back; +moveleft\";\nalias -walk \"-back -1; -moveleft -1\";";
                break;
            case 8:
                moving_bind.name = "Walk back + right.";
                moving_bind.description = "Start walking diagonally backwards + right while uncrouched.";
                moving_bind.code = "alias +walk \"+back; +moveright\";\nalias -walk \"-back -1; -moveright -1\";";
                break;
            case 9:
                moving_bind.name = "Walk forward with +moveup.";
                moving_bind.description = "Start walking forwards while uncrouched and with +moveup (to walk slower).";
                moving_bind.code = "alias +walk \"+moveup; +forward\";\nalias -walk \"-moveup -1; -forward -1\";";
                break;
            case 10:
                moving_bind.name = "Walk back with +moveup.";
                moving_bind.description = "Start walking backwards while uncrouched and with +moveup (to walk slower).";
                moving_bind.code = "alias +walk \"+moveup; +back\";\nalias -walk \"-moveup -1; -back -1\";";
                break;
            case 11:
                moving_bind.name = "Walk left with +moveup.";
                moving_bind.description = "Start walking left while uncrouched and with +moveup (to walk slower).";
                moving_bind.code = "alias +walk \"+moveup; +moveleft\";\nalias -walk \"-moveup -1; -moveleft -1\";";
                break;
            case 12:
                moving_bind.name = "Walk right with +moveup.";
                moving_bind.description = "Start walking right while uncrouched and with +moveup (to walk slower).";
                moving_bind.code = "alias +walk \"+moveup; +moveright\";\nalias -walk \"-moveup -1; -moveright -1\";";
                break;
            case 13:
                moving_bind.name = "Walk forward + left with +moveup.";
                moving_bind.description = "Start walking diagonally forwards + left while uncrouched and with +moveup (to walk slower).";
                moving_bind.code = "alias +walk \"+moveup; +forward; +moveleft\";\nalias -walk \"-moveup -1; -forward -1; -moveleft -1\";";
                break;
            case 14:
                moving_bind.name = "Walk forward + right with +moveup.";
                moving_bind.description = "Start walking diagonally forwards + right while uncrouched and with +moveup (to walk slower).";
                moving_bind.code = "alias +walk \"+moveup; +forward; +moveright\";\nalias -walk \"-moveup -1; -forward -1; -moveright -1\";";
                break;
            case 15:
                moving_bind.name = "Walk back + left with +moveup.";
                moving_bind.description = "Start walking diagonally backwards + left while uncrouched and with +moveup (to walk slower).";
                moving_bind.code = "alias +walk \"+moveup; +back; +moveleft\";\nalias -walk \"-moveup -1; -back -1; -moveleft -1\";";
                break;
            case 16:
                moving_bind.name = "Walk back + right with +moveup.";
                moving_bind.description = "Start walking diagonally backwards + right while uncrouched and with +moveup (to walk slower).";
                moving_bind.code = "alias +walk \"+moveup; +back; +moveright\";\nalias -walk \"-moveup -1; -back -1; -moveright -1\";";
                break;
            case 17:
                moving_bind.name = "Walk forward + leftx2.";
                moving_bind.description = "Start walking diagonally at 22.5 deg with +forward +moveleft +strafe +left while uncrouched.";
                moving_bind.code = "alias +walk \"+forward; +moveleft; +strafe; +left\";\nalias -walk \"-forward -1; -moveleft -1; -strafe -1; -left -1\";";
                break;
            case 18:
                moving_bind.name = "Walk forward + rightx2.";
                moving_bind.description = "Start walking diagonally at 22.5 deg with +forward +moveright +strafe +right while uncrouched.";
                moving_bind.code = "alias +walk \"+forward; +moveright +strafe; +right\";\nalias -walk \"-forward -1; -moveright -1; -strafe -1; -right -1\";";
                break;
            case 19:
                moving_bind.name = "Walk back + leftx2.";
                moving_bind.description = "Start walking diagonally at 22.5 deg with +back +moveleft +strafe +left while uncrouched.";
                moving_bind.code = "alias +walk \"+back; +moveleft; +strafe; +left\";\nalias -walk \"-back -1; -moveleft -1; -strafe -1; -left -1\";";
                break;
            case 20:
                moving_bind.name = "Walk back + rightx2.";
                moving_bind.description = "Start walking diagonally at 22.5 deg with +back +moveright +strafe +right while uncrouched.";
                moving_bind.code = "alias +walk \"+back; +moveright +strafe; +right\";\nalias -walk \"-back -1; -moveright -1; -strafe -1; -right -1\";";
                break;
            case 21:
                moving_bind.name = "Walk forward + leftx2 with +moveup.";
                moving_bind.description = "Start walking diagonally at 22.5 deg with +forward +moveleft +strafe +left while uncrouched with +moveup (to walk slower).";
                moving_bind.code = "alias +walk \"+moveup; +forward; +moveleft; +strafe; +left\";\nalias -walk \"-moveup -1; -forward -1; -moveleft -1; -strafe -1; -left -1\";";
                break;
            case 22:
                moving_bind.name = "Walk forward + rightx2 with +moveup.";
                moving_bind.description = "Start walking diagonally at 22.5 deg with +forward +moveright +strafe +right while uncrouched and with +moveup (to walk slower).";
                moving_bind.code = "alias +walk \"+moveup; +forward; +moveright +strafe; +right\";\nalias -walk \"-moveup -1; -forward -1; -moveright -1; -strafe -1; -right -1\";";
                break;
            case 23:
                moving_bind.name = "Walk back + leftx2 with +moveup.";
                moving_bind.description = "Start walking diagonally at 22.5 deg with +back +moveleft +strafe +left while uncrouched and with +moveup (to walk slower).";
                moving_bind.code = "alias +walk \"+moveup; +back; +moveleft; +strafe; +left\";\nalias -walk \"-moveup -1; -back -1; -moveleft -1; -strafe -1; -left -1\";";
                break;
            case 24:
                moving_bind.name = "Walk back + rightx2 with +moveup.";
                moving_bind.description = "Start walking diagonally at 22.5 deg with +back +moveright +strafe +right while uncrouched and with +moveup (to walk slower).";
                moving_bind.code = "alias +walk \"+moveup; +back; +moveright +strafe; +right\";\nalias -walk \"-moveup -1; -back -1; -moveright -1; -strafe -1; -right -1\";";
                break;
            case 25:
                moving_bind.name = "Walk leftx2 with +moveup.";
                moving_bind.description = "Start walking to the left with +moveleft +strafe +left while uncrouched and with +moveup (to walk slower).";
                moving_bind.code = "alias +walk \"+moveup; +moveleft; +strafe; +left\";\nalias -walk \"-moveup -1; -moveleft -1; -strafe -1; -left -1\";";
                break;
            case 26:
                moving_bind.name = "Walk rightx2 with +moveup.";
                moving_bind.description = "Start walking to the right with +moveright +strafe +right while uncrouched and with +moveup (to walk slower).";
                moving_bind.code = "alias +walk \"+moveup; +moveright; +strafe; +right\";\nalias -walk \"-moveup -1; -moveright -1; -strafe -1; -right -1\";";
                break;
    }

    } else {
        // Crouched starts
        switch (setup.start_moving) {
            case 0:
                moving_bind.name = "Stationary crouched.";
                moving_bind.description = "Start crouched, not moving.";
                moving_bind.code = "alias +walk \"\";\nalias -walk \"\";";
                break;
            case 1:
                moving_bind.name = "Crouch-walk forward.";
                moving_bind.description = "Start crouch-walking forwards.";
                moving_bind.code = "alias +walk \"+forward\";\nalias -walk \"-forward -1\";";
                break;
            case 2:
                moving_bind.name = "Crouch-walk back.";
                moving_bind.description = "Start crouch-walking backwards.";
                moving_bind.code = "alias +walk \"+back\";\nalias -walk \"-back -1\";";
                break;
            case 3:
                moving_bind.name = "Crouch-walk left.";
                moving_bind.description = "Start crouch-walking left.";
                moving_bind.code = "alias +walk \"+moveleft\";\nalias -walk \"-moveleft -1\";"
                break;
            case 4:
                moving_bind.name = "Crouch-walk right.";
                moving_bind.description = "Start crouch-walking right.";
                moving_bind.code = "alias +walk \"+moveright\";\nalias -walk \"-moveright -1\";";
                break;
            case 5:
                moving_bind.name = "Crouch-walk forward + left.";
                moving_bind.description = "Start crouch-walking diagonally forwards + left.";
                moving_bind.code = "alias +walk \"+forward; +moveleft\";\nalias -walk \"-forward -1; -moveleft -1\";";
                break;
            case 6:
                moving_bind.name = "Crouch-walk forward + right.";
                moving_bind.description = "Start crouch-walking diagonally forwards + right.";
                moving_bind.code = "alias +walk \"+forward; +moveright\";\nalias -walk \"-forward -1; -moveright -1\";";
                break;
            case 7:
                moving_bind.name = "Crouch-walk back + left.";
                moving_bind.description = "Start crouch-walking diagonally backwards + left.";
                moving_bind.code = "alias +walk \"+back; +moveleft\";\nalias -walk \"-back -1; -moveleft -1\";";
                break;
            case 8:
                moving_bind.name = "Crouch-walk back + right.";
                moving_bind.description = "Start crouch-walking diagonally backwards + right.";
                moving_bind.code = "alias +walk \"+back; +moveright\";\nalias -walk \"-back -1; -moveright -1\";";
                break;
            case 9:
                moving_bind.name = "Crouch-walk forward with +moveup.";
                moving_bind.description = "Start crouch-walking forwards with +moveup (to move slower).";
                moving_bind.code = "alias +walk \"+moveup; +forward\";\nalias -walk \"-moveup -1; -forward -1\";";
                break;
            case 10:
                moving_bind.name = "Crouch-walk back with +moveup.";
                moving_bind.description = "Start crouch-walking backwards with +moveup (to move slower).";
                moving_bind.code = "alias +walk \"+moveup; +back\";\nalias -walk \"-moveup -1; -back -1\";";
                break;
            case 11:
                moving_bind.name = "Crouch-walk left with +moveup.";
                moving_bind.description = "Start crouch-walking left with +moveup (to move slower).";
                moving_bind.code = "alias +walk \"+moveup; +moveleft\";\nalias -walk \"-moveup -1; -moveleft -1\";";
                break;
            case 12:
                moving_bind.name = "Crouch-walk right with +moveup.";
                moving_bind.description = "Start crouch-walking right with +moveup (to move slower).";
                moving_bind.code = "alias +walk \"+moveup; +moveright\";\nalias -walk \"-moveup -1; -moveright -1\";";
                break;
            case 13:
                moving_bind.name = "Crouch-walk forward + left with +moveup.";
                moving_bind.description = "Start crouch-walking diagonally forwards + left with +moveup (to move slower).";
                moving_bind.code = "alias +walk \"+moveup; +forward; +moveleft\";\nalias -walk \"-moveup -1; -forward -1; -moveleft -1\";";
                break;
            case 14:
                moving_bind.name = "Crouch-walk forward + right with +moveup.";
                moving_bind.description = "Start crouch-walking diagonally forwards + right with +moveup (to move slower).";
                moving_bind.code = "alias +walk \"+moveup; +forward; +moveright\";\nalias -walk \"-moveup -1; -forward -1; -moveright -1\";";
                break;
            case 15:
                moving_bind.name = "Crouch-walk back + left with +moveup.";
                moving_bind.description = "Start crouch-walking diagonally backwards + left with +moveup (to move slower).";
                moving_bind.code = "alias +walk \"+moveup; +back; +moveleft\";\nalias -walk \"-moveup -1; -back -1; -moveleft -1\";";
                break;
            case 16:
                moving_bind.name = "Crouch-walk back + right with +moveup.";
                moving_bind.description = "Start crouch-walking diagonally backwards + right with +moveup (to move slower).";
                moving_bind.code = "alias +walk \"+moveup; +back; +moveright\";\nalias -walk \"-moveup -1; -back -1; -moveright -1\";";
                break;
            case 17:
                moving_bind.name = "Crouch-walk forward + leftx2.";
                moving_bind.description = "Start crouch-walking diagonally at 22.5 deg with +forward +moveleft +strafe +left.";
                moving_bind.code = "alias +walk \"+forward; +moveleft; +strafe; +left\";\nalias -walk \"-forward -1; -moveleft -1; -strafe -1; -left -1\";";
                break;
            case 18:
                moving_bind.name = "Crouch-walk forward + rightx2.";
                moving_bind.description = "Start crouch-walking diagonally at 22.5 with +forward +moveright +strafe +right.";
                moving_bind.code = "alias +walk \"+forward; +moveright +strafe; +right\";\nalias -walk \"-forward -1; -moveright -1; -strafe -1; -right -1\";";
                break;
            case 19:
                moving_bind.name = "Crouch-walk back + leftx2.";
                moving_bind.description = "Start crouch-walking diagonally at 22.5 with +back +moveleft +strafe +left.";
                moving_bind.code = "alias +walk \"+back; +moveleft; +strafe; +left\";\nalias -walk \"-back -1; -moveleft -1; -strafe -1; -left -1\";";
                break;
            case 20:
                moving_bind.name = "Crouch-walk back + rightx2.";
                moving_bind.description = "Start crouch-walking diagonally at 22.5 with +back +moveright +strafe +right.";
                moving_bind.code = "alias +walk \"+back; +moveright +strafe; +right\";\nalias -walk \"-back -1; -moveright -1; -strafe -1; -right -1\";";
                break;
            case 21:
                moving_bind.name = "Crouch-walk forward + leftx2 with +moveup.";
                moving_bind.description = "Start crouch-walking diagonally at 22.5 deg with +forward +moveleft +strafe +left with +moveup (to move slower).";
                moving_bind.code = "alias +walk \"+moveup; +forward; +moveleft; +strafe; +left\";\nalias -walk \"-moveup -1; -forward -1; -moveleft -1; -strafe -1; -left -1\";";
                break;
            case 22:
                moving_bind.name = "Crouch-walk forward + rightx2 with +moveup.";
                moving_bind.description = "Start crouch-walking diagonally at 22.5 deg with +forward +moveright +strafe +right with +moveup (to move slower).";
                moving_bind.code = "alias +walk \"+moveup; +forward; +moveright +strafe; +right\";\nalias -walk \"-moveup -1; -forward -1; -moveright -1; -strafe -1; -right -1\";";
                break;
            case 23:
                moving_bind.name = "Crouch-walk back + leftx2 with +moveup.";
                moving_bind.description = "Start crouch-walking diagonally at 22.5 deg with +back +moveleft +strafe +left with +moveup (to move slower).";
                moving_bind.code = "alias +walk \"+moveup; +back; +moveleft; +strafe; +left\";\nalias -walk \"-moveup -1; -back -1; -moveleft -1; -strafe -1; -left -1\";";
                break;
            case 24:
                moving_bind.name = "Crouch-walk back + rightx2 with +moveup.";
                moving_bind.description = "Start crouch-walking diagonally at 22.5 deg with +back +moveright +strafe +right with +moveup (to move slower).";
                moving_bind.code = "alias +walk \"+moveup; +back; +moveright +strafe; +right\";\nalias -walk \"-moveup -1; -back -1; -moveright -1; -strafe -1; -right -1\";";
                break;
            case 25:
                moving_bind.name = "Crouch-walk leftx2 with +moveup.";
                moving_bind.description = "Start crouch-walking to the left with +moveleft +strafe +left with +moveup (to move slower).";
                moving_bind.code = "alias +walk \"+moveup; +moveleft; +strafe; +left\";\nalias -walk \"-moveup -1; -moveleft -1; -strafe -1; -left -1\";";
                break;
            case 26:
                moving_bind.name = "Crouch-walk rightx2 with +moveup.";
                moving_bind.description = "Start crouch-walking to the right with +moveright +strafe +right with +moveup (to move slower).";
                moving_bind.code = "alias +walk \"+moveup; +moveright; +strafe; +right\";\nalias -walk \"-moveup -1; -moveright -1; -strafe -1; -right -1\";";
                break;
        }
    }


    console.log(setup.start_action);

    action_bind = {};

    switch (setup.start_action) {
        case 0:
            if (setup.num_rockets == 1) {
                action_bind.name = "Shoot 1 rocket.";
                action_bind.description = "Shoot 1 rocket (while looking straight down).";
            } else {
                action_bind.name = "Hold m1.";
                action_bind.description = "Hold m1 (while looking straight down).";
            }
            action_bind.code = "alias +strike \"+attack\";\nalias -strike \"-attack -1\";";
            break;
        case 1:
            // Crouched setup
            if (setup.num_rockets == 1) {
                action_bind.name = "Shoot 1 rocket.";
                action_bind.description = "Shoot 1 rocket (while looking straight down).";
            } else {
                action_bind.name = "Hold m1.";
                action_bind.description = "Hold m1 (while looking straight down).";
            }
            action_bind.code = "alias +strike \"+attack\";\nalias -strike \"-attack -1\";";
            break;
        case 2:
            if (setup.num_rockets == 0) {
                action_bind.name = "Jump.";
                action_bind.description = "Normal jump.";
            } else if (setup.num_rockets == 1) {
                action_bind.name = "JS.";
                action_bind.description = "JS (Jump shot). Shoot 1 rocket + jump at same time (while looking straight down).";
            } else {
                action_bind.name = "JS, then continue holding m1.";
                action_bind.description = "JS (Jump shot). Shoot 1 rocket + jump at the same time (while looking straight down), then continue holding m1.";
            }
            action_bind.code = "alias +strike \"+attack; +jump; -jump -1\";\nalias -strike \"-attack -1\";";
            break;
        case 3:
            if (setup.num_rockets == 0) {
                action_bind.name = "Crouched jump.";
                action_bind.description = "Crouch before jump (makes you go slightly higher than a normal jump).";
            } else if (setup.num_rockets == 1) {
                action_bind.name = "JDS.";
                action_bind.description = "JDS (Jump duck shot). Shoot 1 rocket + jump + duck at same time (while looking straight down).";
            } else {
                action_bind.name = "JDS, then continue holding m1.";
                action_bind.description = "JDS (Jump duck shot). Shoot 1 rocket + jump + duck at the same time (while looking straight down), then continue holding m1.";
            }
            action_bind.code = "alias +strike \"+attack; +jump; -jump -1; +duck\";\nalias -strike \"-attack -1; -duck -1\";";
            break;
        case 4:
            if (setup.num_rockets == 0) {
                action_bind.name = "Ctap jump.";
                action_bind.description = "A Ctap jump (makes you go slightly lower than a normal jump).";
            } else if (setup.num_rockets == 1) {
                action_bind.name = "Ctap JDS.";
                action_bind.description = "Ctap JDS (Ctap Jump duck shot). Shoot 1 rocket + Ctap at same time (while looking straight down).";
            } else {
                action_bind.name = "Ctap JDS, then continue holding m1.";
                action_bind.description = "Ctap JDS (Ctap Jump duck shot). Shoot 1 rocket + Ctap at the same time (while looking straight down), then continue holding m1.";
            }
            action_bind.code = "alias +strike \"+attack; +jump; -jump -1; +duck; -duck -1\";\nalias -strike \"-attack -1\";";
            break;
        case 5:
            //first_rocket_fired_at_tick += 34
            if (setup.num_rockets == 0) {
                action_bind.name = "Jump + quick-switch.";
                action_bind.description = "A normal jump combined with a quick-switch to rocket launcher (delays firing by 34 ticks).";
            } else {
                action_bind.name = "JS + quick-switch.";
                action_bind.description = "JS (Jump shot) + quick-switch to rocket launcher (delays firing by 34 ticks). Jump + quick-switch at same time (while looking straight down), then continue holding m1.";
            } 
            action_bind.code = "alias +strike \"slot1; +attack; +jump; -jump -1\";\nalias -strike \"-attack -1\";";
            break;
        case 6:
            //first_rocket_fired_at_tick += 34
            if (setup.num_rockets == 0) {
                action_bind.name = "JDS + quick-switch.";
                action_bind.description = "JDS (Jump duck shot) combined with a quick-switch to rocket launcher (delays firing by 34 ticks).";
            } else {
                action_bind.name = "JDS + quick-switch.";
                action_bind.description = "JDS (Jump duck shot) + quick-switch to rocket launcher (delays firing by 34 ticks). Crouched jump + quick-switch at same time (while looking straight down), then continue holding m1.";
            } 
            action_bind.code = "alias +strike \"slot1; +attack; +jump; -jump -1; +duck\";\nalias -strike \"-attack -1; -duck -1\";";
            break;
        case 7:
            //first_rocket_fired_at_tick += 34
            if (setup.num_rockets == 0) {
                action_bind.name = "Ctap JDS + quick-switch.";
                action_bind.description = "Ctap JDS (Ctap jump duck shot) combined with a quick-switch to rocket launcher (delays firing by 34 ticks).";
            } else {
                action_bind.name = "Ctap JDS + quick-switch.";
                action_bind.description = "Ctap JDS (Ctap jump duck shot) + quick-switch to rocket launcher (delays firing by 34 ticks). Ctap + quick-switch at same time (while looking straight down), then continue holding m1.";
            } 
            action_bind.code = "alias +strike \"slot1; +attack; +jump; -jump -1; +duck; -duck -1\";\nalias -strike \"-attack -1\";";
            break;
        case 8:
            //first_rocket_fired_at_tick -= 1
            if (setup.num_rockets == 1) {
                action_bind.name = "Ctap JDS (but press m1 1-tick early).";
                action_bind.description = "Ctap JDS (Ctap jump duck shot) with a 1-tick early rocket. This is requires manually timing the shot, but gives more height than a normal Ctap JDS.";
            } else {
                action_bind.name = "Ctap JDS (but press m1 1-tick early), then continue holding m1.";
                action_bind.description = "Ctap JDS (Ctap jump duck shot) with a 1-tick early rocket, then continue holding m1. This is requires manually timing the shot, but gives more height than a normal Ctap JDS.";
            }
            action_bind.code = "alias +strike \"+attack; +jump; -jump -1; +duck; -duck -1\";\nalias -strike \"-attack -1\";";
            break;
        case 9:
            //first_rocket_fired_at_tick -= 2
            if (setup.num_rockets == 1) {
                action_bind.name = "Ctap JDS (but press m1 2-tick early).";
                action_bind.description = "Ctap JDS (Ctap jump duck shot) with a 2-tick early rocket. This is requires manually timing the shot, but gives more height than a normal Ctap JDS. Useful on jumps such as jump_diabahra last.";
            } else {
                action_bind.name = "Ctap JDS (but press m1 2-tick early), then continue holding m1.";
                action_bind.description = "Ctap JDS (Ctap jump duck shot) with a 2-tick early rocket, then continue holding m1. This is requires manually timing the shot, but gives more height than a normal Ctap JDS. Useful on jumps such as jump_diabahra last.";
            }
            action_bind.code = "alias +strike \"+attack; +jump; -jump -1; +duck; -duck -1\";\nalias -strike \"-attack -1\";";
            break;
    }

    setup.binds = [moving_bind, action_bind];
    
    return setup;

}


async function loadHeight(
    height
) {

    const response =
        await fetch(
            `data/${height}.bin`
        );

    if (
        !response.ok
    ) {

        return [];

    }

    const buffer =
        await response
            .arrayBuffer();

    
    // Assert that file has correct format
    if (
        buffer.byteLength
        % RECORD_SIZE
        !== 0
    ) {

        console.error(
            "Corrupt file!"
        );

        return [];

    }

    const view =
        new DataView(
            buffer
        );

    const setups = [];

    for (

        let offset = 0;

        offset <
            buffer.byteLength;

        offset += RECORD_SIZE

    ) {

        setups.push(

            decodeSetup(
                view,
                offset
            )

        );

    }

    return setups;

}
