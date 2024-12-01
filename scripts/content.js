async function getProblemStates() {
    const contestId = await getContestId();
    console.log("probState" + contestId);
    let probState = await chrome.storage.local.get("probState" + contestId);
    if (probState === undefined) probState = "{}";
    else probState = probState["probState" + contestId];
    if (probState === undefined)
        return {};
    probState = JSON.parse(probState);
    return probState;
}

async function getContestId() {
    let cid = await chrome.storage.local.get("cid");
    if (cid === undefined) cid = "{}";
    else cid = cid.cid;
    return cid;
}

function setContestId(contestId) {
    chrome.storage.local.set({"cid": contestId}).then(()=>{}, ()=>{});
}

function setProblemStates(contestId, states) {
    const obj = {};
    obj[`probState${contestId}`] = JSON.stringify(states);
    chrome.storage.local.set(obj).then(()=>{}, ()=>{});
}

async function createProblemSidenav() {
    let listComponent = $(`<ul class="sidenav sidenav-fixed problem-sidenav"></ul>`);
    listComponent.append($(`<li style="display: flex; justify-content: center">
        <a class="tj-logo-link" href="https://algocourses.ru">
        <img src="https://algocourses.ru/static/ejudge_logo.png" alt="logo"></a></li>`));
    listComponent.append($(`<li class="tj-contest-title">${$(".main_phrase").text()}</li>`));
    const problemStates = await getProblemStates();
    const cid = await getContestId();
    $(".nTopNavList").children().each((i, item) => {
        const div = $(item).children("div").eq(0);
        const currentProblem = div.hasClass("nProbCurrent");
        const a = $(div).children("a").eq(0);
        const liClasses = currentProblem === true? "active" : "";
        if (a.attr("href") === undefined)
            return;
        let decoration = "<span></span>";
        if (div.hasClass("nProbOk")) {
            decoration = "<i class='material-icons green-text'>check</i>";
            problemStates[a.text()] = "ok";
        } else if (div.hasClass("nProbBad")) {
            decoration = "<i class='material-icons red-text'>close</i>";
            problemStates[a.text()] = "bad";
        } else if (div.hasClass("nProbTrans")) {
            decoration = "<i class='material-icons yellow-text'>schedule</i>";
            problemStates[a.text()] = "wait";
        } else if (problemStates[a.text()] !== undefined) {
            switch (problemStates[a.text()]) {
                case "ok": decoration = "<i class='material-icons green-text'>check</i>"; break;
                case "bad": decoration = "<i class='material-icons red-text'>close</i>"; break;
                case "wait": decoration = "<i class='material-icons yellow-text'>schedule</i>"; break;
            }
        }
        const element = $(`
            <li class="${liClasses}">
                <a href="${$(a).attr("href")}">${$(a).text()} ${decoration}</a>
            </li>
        `);
        listComponent.append(element);
    })
    console.log(problemStates);
    setProblemStates(cid, problemStates);
    listComponent.append($(`<li class="divider"></li>`));
    $(`#main-menu ul`).children("li").each((i, item) => {
        let elem = $(item).children("div").eq(0).html();
        if (elem.includes("Итог")) return;
        if (!elem.startsWith("<"))
            elem = `<a class="menu" href="#">${elem}</a>`;
        listComponent.append($(`<li>${elem}</li>`));
    });
    return listComponent;
}

function getProblemStatement() {
    let statement = $("<div class='tj-statement'></div>"), constraints, examples = $("<div></div>"), submit;
    let current = "constraints";
    $("#probNavTaskArea-ins").children().each((i, item) => {
        if (current === "skip") return;
        if ($(item).prop("tagName") === "TABLE") {
            constraints = item;
            current = "statement";
        }
        if (current === "statement" && $(item).text() === "Примеры")
            current = "examples";
        if ($(item).hasClass("ui-tabs")) {
            current = "skip"
            submit = item;
        }
        if (current === "statement" && $(item).prop("tagName") === "H3")
            statement.append($(`<div class="divider"></div>`));
        if (current === "statement")
            statement.append($(item));
        if (current === "examples")
            examples.append($(item));
    })
    return {
        statement: statement,
        constraints: constraints,
        examples: examples,
        submit: submit
    }
}


function createSubmitArea() {
    const displayLanguage = "C++";
    const SID = $(`#ej-submit-tabs input[name="SID"]`).val();
    const prob_id = $(`#ej-submit-tabs input[name="prob_id"]`).val();
    const lang_id = $(`#ej-submit-tabs input[name="lang_id"]`).val();
    return $(`<div class="card" style="width: 100%">
        <div>
            <ul class="tabs">
                <li class="tab col s3"><a href="#tab-submit">Отправить</a></li>
                <li class="tab col s3"><a href="#tab-run">Запустить на сервере</a></li>
            </ul>
        </div>
        <div id="tab-submit" style="padding: 16px">
            <p>Отправить (${displayLanguage})</p>
            <form method="POST" enctype="multipart/form-data" 
                action="https://ejudge.algocourses.ru/cgi-bin/new-client">
                <input type="hidden" name="SID" value="${SID}">
                <input type="hidden" name="prob_id" value="${prob_id}">
                <input type="hidden" name="lang_id" value="${lang_id}">
                <textarea id="submitTextArea" name="text_form" rows="20" cols="60"></textarea>
                <div class="file-field input-field">
                    <div class="btn">
                        <span>Загрузить файл</span>
                        <input type="file" name="file">
                    </div>
                    <div class="file-path-wrapper">
                        <input class="file-path validate" type="text">
                    </div>
                </div>
                <input class="btn" type="submit" name="action_40" value="Отправить!"/>
            </form>
        </div>
        <div id="tab-run" class="col s12" style="padding: 16px">
            <p><br><br><br><br><br><br>
            В разработке
            <br><br><br><br><br><br></p>
        </div>
    </div>`);
}

function createSolutionTable() {
    const table = $(`<table class="tj-styled-table"></table>`);
    $("#ej-main-submit-tab .table tbody").children("tr").each((i, item) => {
        const tr = $(`<tr></tr>`);
        $(item).children("td").each((j, cell) => {
            tr.append(`<td>${$(cell).html()}</td>`)
        });
        table.append(tr);
    })
    const card = $(`<div class="card" style="padding: 16px; overflow-x: scroll; width: 100%"></div>`);
    card.append(`<h2>Предыдущие решения</h2>`);
    card.append(table);
    return card;
}

function createProblemStatement() {
    const data = getProblemStatement();
    const row1 = $(`<div class="row"></div>`);

    const col1 = $("<div class='col sm12 l8 pr-4'></div>");
    col1.append(data.statement);
    row1.append(col1);

    const col2 = $("<div class='col sm12 l4'></div>");
    col2.append(data.constraints);
    col2.append(data.examples);
    row1.append(col2);

    const row2 = $(`<div class="row"></div>`);

    const col3 = $("<div class='col sm12 l8'></div>");
    col3.append(createSubmitArea());
    col3.append(createSolutionTable());
    row2.append(col3);

    const container = $(`<div></div>`);
    container.append(row1);
    container.append(row2);

    return container;
}

async function createContent() {
    const row = $("<div></div>");

    const col1 = $("<div></div>");
    col1.append(await createProblemSidenav());

    const col2 = $("<div class='content-after-sidenav'></div>");
    col2.append(createProblemStatement());

    row.append(col1);
    row.append(col2);
    return row;
}

function replaceContestTaskPage() {
    $("head").append(`
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    `);
    createContent().then(content => {
        $(".probNav").remove();
        $("#l12-col").remove();
        $("#l11").remove();
        $("#statusLine").addClass("hidden");
        content.insertAfter(".server_status_on");
        $('.tabs').tabs();
        CodeMirror.fromTextArea(document.getElementById("submitTextArea"), {
            lineNumbers: true,
            mode: "text/x-c++src"
        });
    });
}

function createContestInfo() {
    const table = $(`<table class="tj-styled-table"></table>`);
    $("table.info-table-line tbody").children("tr").each((i, item) => {
        const tr = $(`<tr></tr>`);
        $(item).children("td").each((j, cell) => {
            tr.append(`<td>${$(cell).html()}</td>`)
        });
        table.append(tr);
    })
    const card = $(`<div class="card" style="padding: 16px; overflow-x: scroll; width: 100%"></div>`);
    card.append(`<h2>Состояние сервера</h2>`);
    card.append(`<p>${$("#probNavTaskArea-ins").children("p").eq(0).text()}</p>`)
    card.append(table);

    const options = $(`<table class="tj-styled-table"></table>`);
    $("#HideOptions table tbody").children("tr").each((i, item) => {
        const tr = $(`<tr></tr>`);
        $(item).children("td").each((j, cell) => {
            tr.append(`<td>${$(cell).html()}</td>`)
        });
        options.append(tr);
    })

    const compilersCollapsible = $(`<ul class="collapsible tj-compiler-options">
        <li>
            <div class="collapsible-header"><i class="material-icons">code</i>Опции компиляторов</div>
            <div class="collapsible-body">${$("<div/>").append(options).html()}</div>
        </li>
    </ul>`);

    const mainDiv = $(`<div></div>`);
    mainDiv.append(card);
    mainDiv.append(compilersCollapsible);
    return mainDiv;
}

async function createContestInfoPage() {
    const row = $("<div></div>");

    const col1 = $("<div></div>");
    col1.append(await createProblemSidenav());

    const col2 = $("<div class='content-after-sidenav'></div>");
    col2.append(createContestInfo());

    row.append(col1);
    row.append(col2);
    return row;
}

function replaceContestInfoPage() {
    $("head").append(`
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    `);
    createContestInfoPage().then(content => {
        $(".probNav").remove();
        $("#l12-col").remove();
        $("#l11").remove();
        $("#l13").remove();
        $("#main-cont").append(content);
        $('.tabs').tabs();
        $('.collapsible').collapsible();
    });
}

function createLoginPage() {
    const contestId = $("input[name='contest_id']").val();
    const role = $("input[name='role']").val();
    setContestId(contestId);

    return $(`<div class="center-content-on-page"><div class="card tj-login-card">
        <a class="back-link" href="https://algocourses.ru">Назад</a>
        <div class="card-image">
        <img src="https://algocourses.ru/static/ejudge_logo.png">
        </div>
        <div class="card-content">
            <p>${$(".main_phrase").text()}</p>
            <form method="post" enctype="application/x-www-form-urlencoded" 
                  action="https://ejudge.algocourses.ru/cgi-bin/new-client">
                <input type="hidden" name="contest_id" value="${contestId}">
                <input type="hidden" name="role" value="${role}">
                <div class="input-field">
                    <input type="text" id="username" required class="validate" name="login">
                    <label for="username">Логин</label>
                </div>
                <div class="input-field">
                    <input type="password" id="password" required class="validate" name="password">
                    <label for="password">Пароль</label>
                </div>
                <button class="btn waves-effect waves-light w-100" type="submit" name="action_2">
                    Войти
                </button>
            </form>
        </div>
    </div></div>`);
}

function replaceLoginPage() {
    $("#container").append(createLoginPage());
    $("#l12-col").remove();
    $("#l11").remove();
    $("#l13").remove();
}

function createAllSubmissions() {
    const table = $(`<table class="tj-styled-table"></table>`);
    table.append(`<thead><tr>
        <td>Номер решения</td>
        <td>Время</td>
        <td>Размер</td>
        <td>Задача</td>
        <td>Язык</td>
        <td>Результат</td>
        <td>Ошибка на тесте</td>
        <td>Посмотреть исходный текст</td>
        <td>Просмотреть протокол</td>
    </tr></thead>`);
    $("#probNavTaskArea-ins table tbody").children("tr").each((i, item) => {
        const tr = $(`<tr></tr>`);
        $(item).children("td").each((j, cell) => {
            tr.append(`<td>${$(cell).html()}</td>`)
        });
        table.append(tr);
    })
    const card = $(`<div class="card" style="padding: 16px; overflow-x: scroll; width: 100%"></div>`);
    card.append(`<h2>Посылки</h2>`);
    const urlParams = new URLSearchParams(window.location.search);
    const allRuns = urlParams.get('all_runs');
    if (allRuns == "1")
        card.append(`<a href="${window.location.href.replace('all_runs=1', 'all_runs=0')}">
            Посмотреть только последние 15 посылок</a>`);
    else {
        let newLoc = window.location.href.replace("all_runs=0", "all_runs=1");
        if (!newLoc.includes("all_runs"))
            newLoc += "&all_runs=1";
        card.append(`<a href="${newLoc}">
            Посмотреть все послыки (сейчас показаны последние 15)</a>`);
    }
    card.append(table);
    return card;
}

async function createAllSubmissionsPage() {
    const row = $("<div></div>");

    const col1 = $("<div></div>");
    col1.append(await createProblemSidenav());

    const col2 = $("<div class='content-after-sidenav'></div>");

    col2.append(createAllSubmissions());

    row.append(col1);
    row.append(col2);
    return row;
}

function replaceAllSubmissionsPage() {
    $("head").append(`
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    `);
    createAllSubmissionsPage().then(content => {
        $(".probNav").remove();
        $("#l12-col").remove();
        $("#l11").remove();
        $("#l13").remove();
        $("#main-cont").append(content);
        $('.tabs').tabs();
        $('.collapsible').collapsible();
    });
}

$(document).ready(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    if (action == "139")
        replaceContestTaskPage();
    else if (action == "2")
        replaceContestInfoPage();
    else if (action == "140")
        replaceAllSubmissionsPage();
    else if (action === undefined || action === null)
        replaceLoginPage();

})
