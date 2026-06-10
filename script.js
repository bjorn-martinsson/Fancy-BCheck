let setups = {};

let currentResults = [];

async function loadData() {

    const response =
        await fetch("setups.json");

    setups =
        await response.json();

    console.log("Loaded setups");
}

loadData();

function togglePreferences() {

    document
        .getElementById("preferences")
        .classList
        .toggle("hidden");

}

function getWeights() {

    return {

        difficulty:
            Number(
                document.getElementById(
                    "difficultyWeight"
                ).value
            ),

        speed:
            Number(
                document.getElementById(
                    "speedWeight"
                ).value
            ),

        consistency:
            Number(
                document.getElementById(
                    "consistencyWeight"
                ).value
            )

    };
}

function scoreSetup(setup) {

    const w =
        getWeights();

    return (

        setup.difficulty *
        w.difficulty

        +

        setup.speed *
        w.speed

        +

        setup.consistency *
        w.consistency

    );

}

function findSetups() {

    const target =
        document
        .getElementById(
            "targetInput"
        )
        .value;

    currentResults =
        setups[target] || [];

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

            div.innerHTML = `
                <h3>
                    Score:
                    ${scoreSetup(setup)}
                </h3>

                <p>
                    ${setup.description}
                </p>

                <ul>
                    <li>
                        Difficulty:
                        ${setup.difficulty}
                    </li>

                    <li>
                        Speed:
                        ${setup.speed}
                    </li>

                    <li>
                        Consistency:
                        ${setup.consistency}
                    </li>
                </ul>
            `;

            container.appendChild(
                div
            );

        });

}


const sliders = [

    "difficultyWeight",
    "speedWeight",
    "consistencyWeight"

];

sliders.forEach(id => {

    const slider =
        document.getElementById(id);

    const valueDisplay =
        document.getElementById(
            id.replace(
                "Weight",
                "Value"
            )
        );

    const saved =
        localStorage.getItem(id);

    if (saved !== null) {

        slider.value = saved;

    }

    valueDisplay.textContent =
        slider.value;

    slider.addEventListener(
        "input",
        () => {

            valueDisplay.textContent =
                slider.value;

            localStorage.setItem(
                id,
                slider.value
            );

            rerankResults();

        }
    );

});
