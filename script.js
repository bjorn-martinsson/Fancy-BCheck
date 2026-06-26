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

document
    .getElementById("searchForm")
    .addEventListener(
        "submit",
        event => {

            event.preventDefault();

            findSetups();

        }
    );


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
            });
            
            slider.addEventListener(
                "change",
                () => {
                showToast("Preferences updated. Reranking search results...", 2000) 
                rerankResults();
            });

            number.addEventListener(
                "change",
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

                showToast("Preferences updated. Reranking search results...", 2000) 
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

    showToast("Preferences reset to default. Reranking search results...", 2000) 
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
    
    if (isNaN(inputVal) || inputVal < 0) {
        showWarningToast("This website currently only supports non-negative integer heights.");
    }

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

    currentResults = currentResults
        .map(setup => ({
            setup: setup,
            score: scoreSetup(setup)
        }))
        .sort(
            (a, b) =>
                b.score - a.score
        )
        .map(
            item => item.setup
        );

    displayResults();

}

let maxDisplayed = 20;

function setMaxDisplayed(value) {

    maxDisplayed = value;

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
    
    container.innerHTML = `

    <div class="results-controls">

        <p>

            Showing

            ${Math.min(
                maxDisplayed,
                currentResults.length
            )}

            of

            ${currentResults.length}

            setups

        </p>

        <div class="show-buttons">
            <button
                class="${
                    maxDisplayed === 20
                        ? "active"
                        : ""
                }"
                onclick="setMaxDisplayed(20)">
                20
            </button>

            <button
                class="${
                    maxDisplayed === 50
                        ? "active"
                        : ""
                }"
                onclick="setMaxDisplayed(50)">
                50
            </button>

            <button
                class="${
                    maxDisplayed === 250
                        ? "active"
                        : ""
                }"
                onclick="setMaxDisplayed(250)">
                250
            </button>

            <button
                class="${
                    maxDisplayed === Infinity
                        ? "active"
                        : ""
                }"
                onclick="setMaxDisplayed(Infinity)">
                All
            </button>

        </div>

    </div>

    `;

    const shownResults =
    currentResults.slice(
        0,
        maxDisplayed
    );

    shownResults.forEach(setup => {

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
                    Initial hspeed and hspeed from each rocket

                    <span
                        class="tooltip-container">

                        ⓘ

                        <span
                            class="tooltip">

                            The initial walking speed and the speed you have after getting hit by rockets, ordered by when they were shot. Yellow color indicates that you should be crouched. Blue color indicates that you should be uncrouched.

                        </span>
                    </span>
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
                async (event) => {

                    await copyText(
                        allCode
                    );

                    const button =
                        event.target;

                    const oldText =
                        button.textContent;

                    button.textContent =
                        "Copied ✓";
                    
                    button.classList.add(
                        "copied"
                    );

                    showToast(
                        "Copied bind ✓:\n\n" + allCode
                    );
                    
                    button.disabled =
                        true;

                    setTimeout(
                        () => {

                            button.textContent =
                                oldText;
                            
                            button.classList.remove(
                                "copied"
                            );
                            
                            button.disabled =
                                false;

                        },
                        2000
                    );

                }
            );

            container.appendChild(
                div
            );

        }
    );

}

function showToast(text, duration = 5000) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = text;
    document.body.appendChild(toast);

    // 1. Force a reflow/repaint so the browser registers the starting state,
    // then add the 'show' class to fade it in.
    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    // 2. Schedule the fade out
    setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.add("hide");

        // 3. Wait for the CSS transition (400ms / 0.4s) to finish before removing from DOM
        setTimeout(() => {
            toast.remove();
        }, 400); 

    }, duration);
}

// Show red toast
function showWarningToast(text, duration = 5000) {
    const toast = document.createElement("div");
    toast.className = "warningToast";
    toast.textContent = text;
    document.body.appendChild(toast);

    // 1. Force a reflow/repaint so the browser registers the starting state,
    // then add the 'show' class to fade it in.
    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    // 2. Schedule the fade out
    setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.add("hide");

        // 3. Wait for the CSS transition (400ms / 0.4s) to finish before removing from DOM
        setTimeout(() => {
            toast.remove();
        }, 400); 

    }, duration);
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
        techniques.bounce?.possible
    ) {
        if (techniques.bounce.fullyAutomatic) {
            if (!techniques.syncedBounce.fullyAutomatic) {
                if (techniques.bounce.fullyAutomaticCrouched && techniques.bounce.fullyAutomaticStanding) {
                    tags.push(
                        createTag(
                            "Bounce (Fully auto)",
                            {
                                description:
                                    "Holding m1 (while looking straight down) results in a rocket that explodes the tick the player hits the ground. Can be used to hit a crouched bounce.",

                                type:
                                    "technique-fullyAuto"
                            }
                        )
                    );
                } else if (techniques.bounce.fullyAutomaticCrouched) {
                    tags.push(
                        createTag(
                            "Bounce (Fully auto with crouched prefire)",
                            {
                                description:
                                    "Holding m1 (while looking straight down and being crouched) results in a rocket that explodes the tick the player hits the ground. Can be used to hit a crouched bounce.",

                                type:
                                    "technique-fullyAuto"
                            }
                        )
                    );

                } else if (techniques.bounce.fullyAutomaticStanding) {
                    tags.push(
                        createTag(
                            "Bounce (Fully auto with standing prefire)",
                            {
                                description:
                                    "Holding m1 (while looking straight down and being uncrouched) results in a rocket that explodes the tick the player hits the ground. Can be used to hit a crouched bounce.",

                                type:
                                    "technique-fullyAuto"
                            }
                        )
                    );

                }
            }

        } else if (techniques.bounce.automatic) {
            if (!techniques.syncedBounce.automatic) {
                tags.push(
                    createTag(
                        "Bounce (Auto)",
                        {
                            description:
                                `Holding m1 results in a rocket that can be used to hit a crouched bounce. However, this require aiming the rocket. If aimed straight down, the rocket explodes ${setup.tick_delay_auto_bounce} ${setup.tick_delay_auto_bounce == 1 ? "tick" : "ticks"} too early.`,

                            type:
                                "technique-auto"
                        }
                    )
                );
            }
        } else {
            if (!techniques.syncedBounce.possible) {
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

    }


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
        techniques.spb?.possible
    ) {

        tags.push(
            createTag(
                "Synced powerbounce",
                {
                    description:
                        "Synced powerbounce (bhop + two rockets) is possible.",

                    type:
                        "technique-tag"
                }
            )
        );

    }
    else if (
        techniques.sjbpb?.possible
    ) {
        tags.push(
            createTag(
                "Synced jumpbug powerbounce",
                {
                    description:
                        "Synced jumpbug powerbounce (jumpbug + two rockets) is possible.",

                    type:
                        "technique-tag"
                }
            )
        );

        if (
            techniques.pb?.possible
        ) {

            tags.push(
                createTag(
                    "Powerbounce",
                    {
                        description:
                            "Powerbounce (bhop + rocket) is possible.",

                        type:
                            "technique-tag"
                    }
                )
            );

        }

    } else if (
            techniques.pb?.possible
    ) {

        tags.push(
            createTag(
                "Powerbounce",
                {
                    description:
                        "Powerbounce (bhop + rocket) is possible.",

                    type:
                        "technique-tag"
                }
            )
        );

    } else if (
            techniques.jbpb?.possible
    ) {

        tags.push(
            createTag(
                "Jumpbug powerbounce",
                {
                    description:
                        "Jumpbug powerbounce (jumpbug + rocket) is possible.",
                    type:
                        "technique-tag"
                }
            )
        );
    }
    
    if (
        techniques.standingBounce?.possible
    ) {

        if (techniques.standingBounce.fullyAutomatic) {
            if (!techniques.syncedStandingBounce.fullyAutomatic) {

                if (techniques.standingBounce.fullyAutomaticCrouched && techniques.standingBounce.fullyAutomaticStanding) {
                    tags.push(
                        createTag(
                            "Standing bounce (Fully auto)",
                            {
                                description:
                                    "Holding m1 (while looking straight down) results in a rocket that explodes the tick the player hits the ground. Can be used to hit a standing bounce.",

                                type:
                                    "technique-fullyAuto"
                            }
                        )
                    );
                } else if (techniques.standingBounce.fullyAutomaticCrouched) {
                    tags.push(
                        createTag(
                            "Standing bounce (Fully auto with crouched prefire)",
                            {
                                description:
                                    "Holding m1 (while looking straight down and being crouched) results in a rocket that explodes the tick the player hits the ground. Can be used to hit a standing bounce.",

                                type:
                                    "technique-fullyAuto"
                            }
                        )
                    );

                } else if (techniques.standingBounce.fullyAutomaticStanding) {
                    tags.push(
                        createTag(
                            "Standing bounce (Fully auto with standing prefire)",
                            {
                                description:
                                    "Holding m1 (while looking straight down and being uncrouched) results in a rocket that explodes the tick the player hits the ground. Can be used to hit a standing bounce.",

                                type:
                                    "technique-fullyAuto"
                            }
                        )
                    );
                }
            }

        } else if (techniques.standingBounce.automatic) {
            if (!techniques.syncedStandingBounce.automatic) {
                tags.push(
                    createTag(
                        "Standing bounce (Auto)",
                        {
                            description:
                                `Holding m1 results in a rocket that can be used to hit a standing bounce. However, this require aiming the rocket. If aimed straight down, the rocket explodes ${setup.tick_delay_auto_standing_bounce} ${setup.tick_delay_auto_standing_bounce == 1 ? "tick" : "ticks"} too early.`,

                            type:
                                "technique-auto"
                        }
                    )
                );
            }

        } else {
            if (!techniques.syncedStandingBounce.possible) {
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

    }

    if (
        techniques.syncedBounce?.possible
    ) {
        if (techniques.syncedBounce.automatic) {
            if (techniques.syncedBounce.fullyAutomatic) {

                if (techniques.syncedBounce.fullyAutomaticCrouched && techniques.syncedBounce.fullyAutomaticStanding) {
                    tags.push(
                        createTag(
                            "Synced bounce (Fully auto)",
                            {
                                description:
                                    "Holding m1 (while looking straight down) prefires a rocket that explodes the tick the player hits the ground. Can be used to hit a crouched bounce/synced bounce.",

                                type:
                                    "technique-fullyAuto"
                            }
                        )
                    );
                } else if (techniques.syncedBounce.fullyAutomaticCrouched) {
                    tags.push(
                        createTag(
                            "Synced bounce (Fully auto with crouched prefire)",
                            {
                                description:
                                    "Holding m1 (while looking straight down and being crouched) prefires a rocket that explodes the tick the player hits the ground. Can be used to hit a crouched bounce/synced bounce.",

                                type:
                                    "technique-fullyAuto"
                            }
                        )
                    );
                } else if (techniques.syncedBounce.fullyAutomaticStanding) {
                    tags.push(
                        createTag(
                            "Synced bounce (Fully auto with standing prefire)",
                            {
                                description:
                                    "Holding m1 (while looking straight down and being uncrouched) prefires a rocket that explodes the tick the player hits the ground. Can be used to hit a crouched bounce/synced bounce.",

                                type:
                                    "technique-fullyAuto"
                            }
                        )
                    );
                }

            } else {
                tags.push(
                    createTag(
                        "Synced bounce (Auto)",
                        {
                            description:
                                `Holding m1 prefires a rocket that can be used to hit a crouched bounce/synced bounce. However, this require aiming the rocket. If aimed straight down, the rocket explodes ${setup.tick_delay_auto_synced_bounce} ${setup.tick_delay_auto_synced_bounce == 1 ? "tick": "ticks"} too early.`,

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
    
    if (
        techniques.syncedStandingBounce?.possible
    ) {
        if (techniques.syncedStandingBounce.automatic) {
            if (techniques.syncedStandingBounce.fullyAutomatic) {
                if (techniques.syncedStandingBounce.fullyAutomaticCrouched && techniques.syncedStandingBounce.fullyAutomaticStanding) {
                    tags.push(
                        createTag(
                            "Synced standing bounce (Fully auto)",
                            {
                                description:
                                    "Holding m1 (while looking straight down) prefires a rocket that explodes the tick the player hits the ground. Can be used to hit a standing bounce/synced standing bounce.",

                                type:
                                    "technique-fullyAuto"
                            }
                        )
                    );
                } else if (techniques.syncedStandingBounce.fullyAutomaticCrouched) {
                    tags.push(
                        createTag(
                            "Synced standing bounce (Fully auto with crouched prefire)",
                            {
                                description:
                                    "Holding m1 (while looking straight down and being crouched) prefires a rocket that explodes the tick the player hits the ground. Can be used to hit a standing bounce/synced standing bounce.",

                                type:
                                    "technique-fullyAuto"
                            }
                        )
                    );
                } else if (techniques.syncedStandingBounce.fullyAutomaticStanding) {
                    tags.push(
                        createTag(
                            "Synced standing bounce (Fully auto with standing prefire)",
                            {
                                description:
                                    "Holding m1 (while looking straight down and being uncrouched) prefires a rocket that explodes the tick the player hits the ground. Can be used to hit a standing bounce/synced standing bounce.",

                                type:
                                    "technique-fullyAuto"
                            }
                        )
                    );
                }

            } else {
                tags.push(
                    createTag(
                        "Synced standing bounce (Auto)",
                        {
                            description:
                                `Holding m1 prefires a rocket that can be used to hit a standing bounce/synced standing bounce. However, this require aiming the rocket. If aimed straight down, the rocket explodes ${setup.tick_delay_auto_synced_bounce} ${setup.tick_delay_auto_synced_bounce == 1? "tick" : "ticks"} too early.`,

                            type:
                                "technique-auto"
                        }
                    )
                );

            }
        } else {
            tags.push(
                createTag(
                    "Synced standing bounce",
                    {
                        description:
                            "It is possible to prefire a rocket to hit a synced standing bounce, but it will require manually timing/aiming the prefire.",

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
return "<div class=\"tag-row\">"
    +
    setup.rocketSpeeds
	.map((speed, index) => {

		const firedCrouched =
			(setup.rocket_fired_crouched_flag & (1 << index)) !== 0;

		const hitCrouched =
			(setup.rocket_hit_crouched_flag & (1 << index)) !== 0;
		
		let text;
		let description;
		let type;
		if (index == 0) {
			if (firedCrouched) {
				text =
					`
                    <span class=speed-display>${speed.toFixed(2)}</span>
					`;
				description =
					`
						Crouch-walk at ${speed.toFixed(2)} u/s speed.
					`;
				type = "speed-badge-crouched";
			} else {
				text =
					`
                    <span class=speed-display>${speed.toFixed(2)}</span>
					`;
				description =
					`
						Walk at ${speed.toFixed(2)} u/s speed.
					`;
				type = "speed-badge-uncrouched";
			}
		} else if (speed === 0 && firedCrouched) {
		    text =
				`
					R<span class="tag-sub">${index}</span>: -
				`;
			description =
				`
					Rocket ${index} is purely a timing rocket. It is not supposed to hit the player.
				`;
			type = "speed-badge-crouched";
		} else if (speed === 0 && !firedCrouched) {
		    text =
				`
					R<span class="tag-sub">${index}</span>: -
				`;
			description =
				`
					Rocket ${index} is purely a timing rocket. It is not supposed to hit the player.
				`;
			type = "speed-badge-uncrouched";

		} else if (firedCrouched && hitCrouched) {
		    text =
				`
                    R<span class="tag-sub">${index}</span>: 
					<span class=speed-display>${speed.toFixed(2)}</span>
				`;
			description =
				`
					Rocket ${index} should be shot and explode while the player is crouched, resulting in ${speed.toFixed(2)} u/s speed.
				`;
			type = "speed-badge-crouched";

		} else if (!firedCrouched && !hitCrouched) {
		    text =
				`
                    R<span class="tag-sub">${index}</span>: 
                    <span class=speed-display>${speed.toFixed(2)}</span>
				`;
			description =
				`
					Rocket ${index} should be shot and explode while the player is uncrouched, resulting in ${speed.toFixed(2)} u/s speed.
				`;
			type = "speed-badge-uncrouched";

		} else if (firedCrouched && !hitCrouched) {
		    text =
				`
                    R<span class="tag-sub">${index}</span>: 
					<span class=speed-display>${speed.toFixed(2)}</span>
					(C -> S)
				`;
			description =
				`
					Rocket ${index} should be shot while the player is crouched and explode while the player is uncrouched, resulting in ${speed.toFixed(2)} u/s speed.
				`;
			type = "speed-badge";

		} else if (!firedCrouched && hitCrouched) {
		    text =
				`
                    R<span class="tag-sub">${index}</span>: 
					<span class=speed-display>${speed.toFixed(2)}</span>
				    (Ctap)
                `;
			description =
				`
					Rocket ${index} should be shot while the player is uncrouched and explode while the player is crouched, resulting in ${speed.toFixed(2)} u/s speed.
				`;
			type = "speed-badge";
		}

		return createTag(
			text,
			{
                description: description,
				type: type
			}
		);

	})
	.join("")
    + "</div>";

}

async function copyText(text) {

    await navigator.clipboard
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
    "NOMOVEMENTBIND",
    "NOACTIONBIND",
    "ABOUNCE",
    "ASBOUNCE",
    "ASTANDBOUNCE",
    "ASSTANDBOUNCE",
    "FABOUNCE",
    "FASBOUNCE",
    "FASTANDBOUNCE",
    "FASSTANDBOUNCE",
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
    "SSTANDBOUNCE",
    "CROUCHED",
    "NOMOVING",
    "DIAGONAL",
    "MOVEUP",
    "STRAFE",
    "SHOTGUN",
    "ZEROROCKET",
    "ONEROCKET",
    "TWOTHREEROCKETS",
    "JS",
    "JDS",
    "CTAP_JDS",
    "ONETICK",
    "TWOTICK"
];

const RECORD_SIZE = 92;

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
    
    setup.tick_delay_auto_bounce =
        view.getUint8(cursor++);

    setup.tick_delay_auto_synced_bounce =
        view.getUint8(cursor++);

    setup.tick_delay_auto_standing_bounce =
        view.getUint8(cursor++);

    setup.tick_delay_auto_synced_standing_bounce =
        view.getUint8(cursor++);

    setup.bounce_flag = 
        view.getUint8(cursor++);
    
    setup.standing_bounce_flag = 
        view.getUint8(cursor++);
    
    setup.rocket_fired_crouched_flag = 
        view.getUint8(cursor++);
    
    setup.rocket_hit_crouched_flag =
        view.getUint8(cursor++);
    
    for (const flag of FLAG_NAMES) {

        setup[flag] =
            view.getUint8(
                cursor++
            );

    }

    setup.speeds = [];

    for (let i = 0; i < 7; i++) {

        setup.speeds.push(

            view.getUint32(
                cursor,
                true
            ) / 100

        );

        cursor += 4;
    }
    setup.speeds = setup.speeds.slice(0, setup.num_rockets + 1);

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
    flag = setup.bounce_flag;
    setup.techniques = {};
    setup.techniques.bounce = {
        possible: !!(flag & 1),
        automatic: !!(flag & 2),
        fullyAutomaticCrouched: !!(flag & 4),
        fullyAutomaticStanding: !!(flag & 8)
    }
    setup.techniques.bounce.fullyAutomatic = setup.techniques.bounce.fullyAutomaticCrouched || setup.techniques.bounce.fullyAutomaticStanding;
    
    // synced bounce
    setup.techniques.syncedBounce = {
        possible: !!(flag & 16),
        automatic: !!(flag & 32),
        fullyAutomaticCrouched: !!(flag & 64),
        fullyAutomaticStanding: !!(flag & 128)
    }
    setup.techniques.syncedBounce.fullyAutomatic = setup.techniques.syncedBounce.fullyAutomaticCrouched || setup.techniques.syncedBounce.fullyAutomaticStanding;

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

    
    // power bounce
    setup.techniques.pb = {
        possible: false,
    }
    if (setup.PB >= 128) {
        setup.techniques.pb.possible = true;
    }
    
    // synced power bounce
    setup.techniques.spb = {
        possible: false,
    }
    if (setup.SPB >= 128) {
        setup.techniques.spb.possible = true;
    }
    
    // jb power bounce
    setup.techniques.jbpb = {
        possible: false,
    }
    if (setup.JBPB >= 128) {
        setup.techniques.jbpb.possible = true;
    }
    
    // synced jb power bounce
    setup.techniques.sjbpb = {
        possible: false,
    }
    if (setup.SJBPB >= 128) {
        setup.techniques.sjbpb.possible = true;
    }


    // standing bounce
    
    
    flag = setup.standing_bounce_flag;
    setup.techniques.standingBounce = {
        possible: !!(flag & 1),
        automatic: !!(flag & 2),
        fullyAutomaticCrouched: !!(flag & 4),
        fullyAutomaticStanding: !!(flag & 8)
    }
    setup.techniques.standingBounce.fullyAutomatic = setup.techniques.standingBounce.fullyAutomaticCrouched || setup.techniques.standingBounce.fullyAutomaticStanding;
    
    // synced standing bounce
    setup.techniques.syncedStandingBounce = {
        possible: !!(flag & 16),
        automatic: !!(flag & 32),
        fullyAutomaticCrouched: !!(flag & 64),
        fullyAutomaticStanding: !!(flag & 128)
    }
    setup.techniques.syncedStandingBounce.fullyAutomatic = setup.techniques.syncedStandingBounce.fullyAutomaticCrouched || setup.techniques.syncedStandingBounce.fullyAutomaticStanding;

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
                moving_bind.code = "alias +walk \"+forward; +moveright; +strafe; +right\";\nalias -walk \"-forward -1; -moveright -1; -strafe -1; -right -1\";";
                break;
            case 19:
                moving_bind.name = "Walk back + leftx2.";
                moving_bind.description = "Start walking diagonally at 22.5 deg with +back +moveleft +strafe +left while uncrouched.";
                moving_bind.code = "alias +walk \"+back; +moveleft; +strafe; +left\";\nalias -walk \"-back -1; -moveleft -1; -strafe -1; -left -1\";";
                break;
            case 20:
                moving_bind.name = "Walk back + rightx2.";
                moving_bind.description = "Start walking diagonally at 22.5 deg with +back +moveright +strafe +right while uncrouched.";
                moving_bind.code = "alias +walk \"+back; +moveright; +strafe; +right\";\nalias -walk \"-back -1; -moveright -1; -strafe -1; -right -1\";";
                break;
            case 21:
                moving_bind.name = "Walk forward + leftx2 with +moveup.";
                moving_bind.description = "Start walking diagonally at 22.5 deg with +forward +moveleft +strafe +left while uncrouched with +moveup (to walk slower).";
                moving_bind.code = "alias +walk \"+moveup; +forward; +moveleft; +strafe; +left\";\nalias -walk \"-moveup -1; -forward -1; -moveleft -1; -strafe -1; -left -1\";";
                break;
            case 22:
                moving_bind.name = "Walk forward + rightx2 with +moveup.";
                moving_bind.description = "Start walking diagonally at 22.5 deg with +forward +moveright +strafe +right while uncrouched and with +moveup (to walk slower).";
                moving_bind.code = "alias +walk \"+moveup; +forward; +moveright; +strafe; +right\";\nalias -walk \"-moveup -1; -forward -1; -moveright -1; -strafe -1; -right -1\";";
                break;
            case 23:
                moving_bind.name = "Walk back + leftx2 with +moveup.";
                moving_bind.description = "Start walking diagonally at 22.5 deg with +back +moveleft +strafe +left while uncrouched and with +moveup (to walk slower).";
                moving_bind.code = "alias +walk \"+moveup; +back; +moveleft; +strafe; +left\";\nalias -walk \"-moveup -1; -back -1; -moveleft -1; -strafe -1; -left -1\";";
                break;
            case 24:
                moving_bind.name = "Walk back + rightx2 with +moveup.";
                moving_bind.description = "Start walking diagonally at 22.5 deg with +back +moveright +strafe +right while uncrouched and with +moveup (to walk slower).";
                moving_bind.code = "alias +walk \"+moveup; +back; +moveright; +strafe; +right\";\nalias -walk \"-moveup -1; -back -1; -moveright -1; -strafe -1; -right -1\";";
                break;
            case 25:
                moving_bind.name = "Walk leftx2 with +moveup.";
                moving_bind.description = "Start walking to the left with +moveleft +strafe +left while uncrouched and with +moveup (to walk slower).";
                moving_bind.code = "alias +walk \"+moveup; +moveleft; +strafe; +left\";\nalias -walk \"-moveup -1; -moveleft -1; -strafe -1; -left -1\";";
                break;
            case 26:
                moving_bind.name = "Walk rightx2 with +moveup.";
                moving_bind.description = "Start walking to the right with +moveright; +strafe +right while uncrouched and with +moveup (to walk slower).";
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
                moving_bind.code = "alias +walk \"+forward; +moveright; +strafe; +right\";\nalias -walk \"-forward -1; -moveright -1; -strafe -1; -right -1\";";
                break;
            case 19:
                moving_bind.name = "Crouch-walk back + leftx2.";
                moving_bind.description = "Start crouch-walking diagonally at 22.5 with +back +moveleft +strafe +left.";
                moving_bind.code = "alias +walk \"+back; +moveleft; +strafe; +left\";\nalias -walk \"-back -1; -moveleft -1; -strafe -1; -left -1\";";
                break;
            case 20:
                moving_bind.name = "Crouch-walk back + rightx2.";
                moving_bind.description = "Start crouch-walking diagonally at 22.5 with +back +moveright +strafe +right.";
                moving_bind.code = "alias +walk \"+back; +moveright; +strafe; +right\";\nalias -walk \"-back -1; -moveright -1; -strafe -1; -right -1\";";
                break;
            case 21:
                moving_bind.name = "Crouch-walk forward + leftx2 with +moveup.";
                moving_bind.description = "Start crouch-walking diagonally at 22.5 deg with +forward +moveleft +strafe +left with +moveup (to move slower).";
                moving_bind.code = "alias +walk \"+moveup; +forward; +moveleft; +strafe; +left\";\nalias -walk \"-moveup -1; -forward -1; -moveleft -1; -strafe -1; -left -1\";";
                break;
            case 22:
                moving_bind.name = "Crouch-walk forward + rightx2 with +moveup.";
                moving_bind.description = "Start crouch-walking diagonally at 22.5 deg with +forward +moveright +strafe +right with +moveup (to move slower).";
                moving_bind.code = "alias +walk \"+moveup; +forward; +moveright; +strafe; +right\";\nalias -walk \"-moveup -1; -forward -1; -moveright -1; -strafe -1; -right -1\";";
                break;
            case 23:
                moving_bind.name = "Crouch-walk back + leftx2 with +moveup.";
                moving_bind.description = "Start crouch-walking diagonally at 22.5 deg with +back +moveleft +strafe +left with +moveup (to move slower).";
                moving_bind.code = "alias +walk \"+moveup; +back; +moveleft; +strafe; +left\";\nalias -walk \"-moveup -1; -back -1; -moveleft -1; -strafe -1; -left -1\";";
                break;
            case 24:
                moving_bind.name = "Crouch-walk back + rightx2 with +moveup.";
                moving_bind.description = "Start crouch-walking diagonally at 22.5 deg with +back +moveright +strafe +right with +moveup (to move slower).";
                moving_bind.code = "alias +walk \"+moveup; +back; +moveright; +strafe; +right\";\nalias -walk \"-moveup -1; -back -1; -moveright -1; -strafe -1; -right -1\";";
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


    action_bind = {};

    const oldm1 = `old m1 to shoot ${setup.num_rockets > 1 ? `a total of ${setup.num_rockets} rockets` : "1 rocket"}`;
    const oldm1more = `old m1 to shoot ${setup.num_rockets - 1} additional ${setup.num_rockets - 1 > 1 ? "rockets" : "rocket"}`;

    switch (setup.start_action) {
        case 0:
            if (setup.num_rockets == 1) {
                action_bind.name = "Shoot 1 rocket.";
                action_bind.description = "Shoot 1 rocket (while looking straight down).";
            } else {
                action_bind.name = `H${oldm1}.`;
                action_bind.description = `H${oldm1} (while looking straight down).`;
            }
            action_bind.code = "alias +strike \"+attack\";\nalias -strike \"-attack -1\";";
            break;
        case 1:
            // Crouched setup
            if (setup.num_rockets == 1) {
                action_bind.name = "Shoot 1 rocket.";
                action_bind.description = "Shoot 1 rocket (while looking straight down).";
            } else {
                action_bind.name = `H${oldm1}.`;
                action_bind.description = `H${oldm1} (while looking straight down).`;
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
                action_bind.name = `JS, then h${oldm1more}.`;
                action_bind.description = `JS (Jump shot). Shoot 1 rocket + jump at the same time (while looking straight down), then h${oldm1more}.`;
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
                action_bind.name = `JDS, then h${oldm1more}.`;
                action_bind.description = `JDS (Jump duck shot). Shoot 1 rocket + jump + duck at the same time (while looking straight down), then h${oldm1more}.`;
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
                action_bind.name = `Ctap JDS, then h${oldm1more}.`;
                action_bind.description = `Ctap JDS (Ctap Jump duck shot). Shoot 1 rocket + Ctap at the same time (while looking straight down), then h${oldm1more}.`;
            }
            action_bind.code = "alias +strike \"+attack; +jump; -jump -1; +duck; -duck -1\";\nalias -strike \"-attack -1\";";
            break;
        case 5:
            //first_rocket_fired_at_tick += 34
            if (setup.num_rockets == 0) {
                action_bind.name = "Jump + quick-switch.";
                action_bind.description = "A normal jump combined with a quick-switch to rocket launcher (delays firing by 34 ticks).";
            } else {
                action_bind.name = `Jump + quick-switch, then h${oldm1}.`;
                action_bind.description = `A normal jump combined with a quick-switch to rocket launcher (delays firing by 34 ticks). Jump + quick-switch at same time (while looking straight down), then h${oldm1}.`;
            } 
            action_bind.code = "alias +strike \"slot1; +attack; +jump; -jump -1\";\nalias -strike \"-attack -1\";";
            break;
        case 6:
            //first_rocket_fired_at_tick += 34
            if (setup.num_rockets == 0) {
                action_bind.name = "Crouched jump + quick-switch.";
                action_bind.description = "Crouched jump combined with a quick-switch to rocket launcher (delays firing by 34 ticks).";
            } else {
                action_bind.name = `Crouched jump + quick-switch, then h${oldm1}.`;
                action_bind.description = `Crouched jump combined with a quick-switch to rocket launcher (delays firing by 34 ticks). Crouched jump + quick-switch at same time (while looking straight down), then h${oldm1}.`;
            } 
            action_bind.code = "alias +strike \"slot1; +attack; +jump; -jump -1; +duck\";\nalias -strike \"-attack -1; -duck -1\";";
            break;
        case 7:
            //first_rocket_fired_at_tick += 34
            if (setup.num_rockets == 0) {
                action_bind.name = "Ctap + quick-switch.";
                action_bind.description = "Ctap combined with a quick-switch to rocket launcher (delays firing by 34 ticks).";
            } else {
                action_bind.name = `Ctap + quick-switch, then h${oldm1}.`;
                action_bind.description = `Ctap combined with a quick-switch to rocket launcher (delays firing by 34 ticks). Ctap + quick-switch at same time (while looking straight down), then h${oldm1}.`;
            } 
            action_bind.code = "alias +strike \"slot1; +attack; +jump; -jump -1; +duck; -duck -1\";\nalias -strike \"-attack -1\";";
            break;
        case 8:
            //first_rocket_fired_at_tick -= 1
            if (setup.num_rockets == 1) {
                action_bind.name = "Ctap JDS (but press m1 1-tick early).";
                action_bind.description = "Ctap JDS (Ctap jump duck shot) with a 1-tick early rocket. This is requires manually timing the shot, but gives more height than a normal Ctap JDS.";
            } else {
                action_bind.name = `Ctap JDS (but press m1 1-tick early), then h${oldm1more}.`;
                action_bind.description = `Ctap JDS (Ctap jump duck shot) with a 1-tick early rocket, then h${oldm1more}. This is requires manually timing the shot, but gives more height than a normal Ctap JDS.`;
            }
            action_bind.code = "alias +strike \"+attack; +jump; -jump -1; +duck; -duck -1\";\nalias -strike \"-attack -1\";";
            break;
        case 9:
            //first_rocket_fired_at_tick -= 2
            if (setup.num_rockets == 1) {
                action_bind.name = "Ctap JDS (but press m1 2-tick early).";
                action_bind.description = "Ctap JDS (Ctap jump duck shot) with a 2-tick early rocket. This is requires manually timing the shot, but gives more height than a normal Ctap JDS. Useful on jumps such as jump_diabahra last.";
            } else {
                action_bind.name = `Ctap JDS (but press m1 2-tick early), then h${oldm1more}.`;
                action_bind.description = `Ctap JDS (Ctap jump duck shot) with a 2-tick early rocket, then h${oldm1more}. This is requires manually timing the shot, but gives more height than a normal Ctap JDS. Useful on jumps such as jump_diabahra last.`;
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
            `data/${Math.floor(height/100)}00to${Math.floor(height/100)}99/${height}.bin.gz`
        );

    if (
        !response.ok
    ) {
        return [];

    }
    
    // Pipe the download through the browser's native decompression engine
    const decompressedStream = response.body.pipeThrough(new DecompressionStream('gzip'));
  
    // Convert the decompressed stream into an ArrayBuffer for your parser
    const decompressedResponse = new Response(decompressedStream);

    const buffer =
        await decompressedResponse
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
