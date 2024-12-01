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
        if (elem.includes("Итог") || elem.includes("Настройки")) return;
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
        hidePreloader();
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
        hidePreloader();
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
    hidePreloader();
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
        hidePreloader();
    });
}

function createStandings() {
    const table = $(`<table class="tj-styled-table tj-standings"></table>`);
    let headerRow = $(`<tr></tr>`);
    const tbody = $(".standings tbody");
    let problemCount = 0;
    tbody.children("tr").eq(0).children("th").each((i, item) => {
        headerRow.append($(`<td>${$(item).text()}</td>`));
        problemCount++;
    });
    headerRow = $(`<thead></thead>`).append(headerRow);
    table.append(headerRow);
    tbody.children("tr").each((i, item) => {
        const tr = $(`<tr></tr>`);
        $(item).children("td").each((j, cell) => {
            if (j < 2 || j >= 2 + problemCount) {
                tr.append(`<td>${$(cell).html()}</td>`);
                return;
            }
            let cellClass = "tj-standings-score ";
            if ($(cell).html().includes("+")) cellClass += "green-text lighten-1";
            else if ($(cell).html().includes("-")) cellClass += "red-text accent-2";
            tr.append(`<td class="${cellClass}">${$(cell).html()}</td>`)
        });
        table.append(tr);
    })
    const card = $(`<div class="card" style="padding: 16px; overflow-x: scroll; width: 100%"></div>`);
    card.append(`<h2>Положение участников</h2>`);
    card.append(table);
    return card;
}

async function createStandingsPage() {
    const row = $("<div></div>");

    const col1 = $("<div></div>");
    col1.append(await createProblemSidenav());

    const col2 = $("<div class='content-after-sidenav'></div>");

    col2.append(createStandings());

    row.append(col1);
    row.append(col2);
    return row;
}

function replaceStandingsPage() {
    $("head").append(`
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    `);
    createStandingsPage().then(content => {
        $(".probNav").remove();
        $("#l12-col").remove();
        $("#l11").remove();
        $("#l13").remove();
        $("#main-cont").append(content);
        hidePreloader();
    });
}

function createMessages() {
    const table = $(`<table class="tj-styled-table"></table>`);
    table.append(`<thead><tr>
        <td>Номер сообщения</td>
        <td>Флаги</td>
        <td>Время</td>
        <td>Размер</td>
        <td>От</td>
        <td>Кому</td>
        <td>Тема</td>
        <td>Просмотр</td>
    </tr></thead>`);
    $("#probNavTaskArea-ins table tbody").children("tr").each((i, item) => {
        const tr = $(`<tr></tr>`);
        $(item).children("td").each((j, cell) => {
            tr.append(`<td>${$(cell).html()}</td>`)
        });
        table.append(tr);
    })
    const card = $(`<div class="card" style="padding: 16px; overflow-x: scroll; width: 100%"></div>`);
    card.append(`<h2>Сообщения</h2>`);
    const urlParams = new URLSearchParams(window.location.search);
    const allClars = urlParams.get('all_clars');
    if (allClars == "1")
        card.append(`<a href="${window.location.href.replace('all_clars=1', 'all_clars=0')}">
            Посмотреть только последние 15 сообщений</a>`);
    else {
        let newLoc = window.location.href.replace("all_clars=0", "all_clars=1");
        if (!newLoc.includes("all_clars"))
            newLoc += "&all_clars=1";
        card.append(`<a href="${newLoc}">
            Посмотреть все сообщения (сейчас показаны последние 15)</a>`);
    }
    card.append(table);
    return card;
}

async function createMessagesPage() {
    const row = $("<div></div>");

    const col1 = $("<div></div>");
    col1.append(await createProblemSidenav());

    const col2 = $("<div class='content-after-sidenav'></div>");

    col2.append(createMessages());

    row.append(col1);
    row.append(col2);
    return row;
}

function replaceMessagesPage() {
    $("head").append(`
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    `);
    createMessagesPage().then(content => {
        $(".probNav").remove();
        $("#l12-col").remove();
        $("#l11").remove();
        $("#l13").remove();
        $("#main-cont").append(content);
        hidePreloader();
    });
}

function createSendMessageForm() {
    const SID = $("input[name='SID']").val();
    return $(`<div class="card tj-send-msg" style="padding: 16px; overflow-x: scroll; width: 100%">
        <form method="post" enctype="application/x-www-form-urlencoded" 
            action="https://ejudge.algocourses.ru/cgi-bin/new-client">
            <h2>Отправить сообщение судьям</h2>
            <input type="hidden" name="SID" value="${SID}">
            <div class="row" style="margin: 0">
                <div class="input-field col s3">
                    <select name="prob_id">
                        ${$("select[name='prob_id']").html()}
                    </select>
                    <label>Задача</label>
                </div>
                <div class="input-field col s9">
                    <input id="topic" type="text" name="subject">
                    <label for="topic">Тема сообщения</label>
                </div>
            </div>
            <div class="row" style="margin: 0">
                <div class="input-field col s12">
                    <textarea id="textarea1" name="text" class="materialize-textarea" rows="30"></textarea>
                    <label for="textarea1">Текст сообщения</label>
                </div>
            </div>
            <div class="row" style="margin: 0">
                <input class="btn col s12" type="submit" name="action_41" value="Отправить"/>
            </div>
            
        </form>
    </div>`);
}

async function createSendMessagePage() {
    const row = $("<div></div>");

    const col1 = $("<div></div>");
    col1.append(await createProblemSidenav());

    const col2 = $("<div class='content-after-sidenav'></div>");

    col2.append(createSendMessageForm());

    row.append(col1);
    row.append(col2);
    return row;
}

function replaceSendMessagePage() {
    $("head").append(`
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    `);
    createSendMessagePage().then(content => {
        $(".probNav").remove();
        $("#l12-col").remove();
        $("#l11").remove();
        $("#l13").remove();
        $("#main-cont").append(content);
        $('select').formSelect();
        hidePreloader();
    });
}

function createProtocol() {
    const table = $(`<table class="tj-styled-table"></table>`);
    table.append(`<thead><tr>
        <td>Номер теста</td>
        <td>Результат</td>
        <td>Время (с)</td>
        <td>Память (RSS KiB)</td>
    </tr></thead>`);
    $(".l14 table tbody").children("tr").each((i, item) => {
        const tr = $(`<tr></tr>`);
        $(item).children("td").each((j, cell) => {
            tr.append(`<td>${$(cell).html()}</td>`)
        });
        table.append(tr);
    })
    const card = $(`<div class="card" style="padding: 16px; overflow-x: scroll; width: 100%"></div>`);
    card.append(`<h2>Протокол тестирования</h2>`);
    card.append($(".l14").children("h2").eq(0));
    card.append($(".l14").children("big").eq(0));
    card.append(table);
    return card;
}

async function createProtocolPage() {
    const row = $("<div></div>");

    const col1 = $("<div></div>");
    col1.append(await createProblemSidenav());

    const col2 = $("<div class='content-after-sidenav'></div>");

    col2.append(createProtocol());

    row.append(col1);
    row.append(col2);
    return row;
}

function replaceProtocolPage() {
    $("head").append(`
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    `);
    createProtocolPage().then(content => {
        $(".probNav").remove();
        $("#l12-col").remove();
        $("#l11").remove();
        $("#l13").remove();
        $("#main-cont").append(content);
        hidePreloader();
    });
}

function createSubmissionSource() {
    const card = $(`<div class="card" style="padding: 16px; overflow-x: scroll; width: 100%"></div>`);
    card.append(`<h2>Исходный код решения</h2>`);
    card.append($(".l14").children("pre").eq(0));
    return card;
}

async function createSubmissionSourcePage() {
    const row = $("<div></div>");

    const col1 = $("<div></div>");
    col1.append(await createProblemSidenav());

    const col2 = $("<div class='content-after-sidenav'></div>");

    col2.append(createSubmissionSource());

    row.append(col1);
    row.append(col2);
    return row;
}

function replaceSubmissionSourcePage() {
    $("head").append(`
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    `);
    createSubmissionSourcePage().then(content => {
        $(".probNav").remove();
        $("#l12-col").remove();
        $("#l11").remove();
        $("#l13").remove();
        $("#main-cont").append(content);
        hidePreloader();
    });
}

function hidePreloader() {
    $(".big-f-preloader").remove();
}

function showPreloader() {
    $("body").append(`<div class="big-f-preloader center-content-on-page">
<div class="preloader-wrapper big active">
      <div class="spinner-layer spinner-blue">
        <div class="circle-clipper left">
          <div class="circle"></div>
        </div><div class="gap-patch">
          <div class="circle"></div>
        </div><div class="circle-clipper right">
          <div class="circle"></div>
        </div>
      </div>

      <div class="spinner-layer spinner-red">
        <div class="circle-clipper left">
          <div class="circle"></div>
        </div><div class="gap-patch">
          <div class="circle"></div>
        </div><div class="circle-clipper right">
          <div class="circle"></div>
        </div>
      </div>

      <div class="spinner-layer spinner-yellow">
        <div class="circle-clipper left">
          <div class="circle"></div>
        </div><div class="gap-patch">
          <div class="circle"></div>
        </div><div class="circle-clipper right">
          <div class="circle"></div>
        </div>
      </div>

      <div class="spinner-layer spinner-green">
        <div class="circle-clipper left">
          <div class="circle"></div>
        </div><div class="gap-patch">
          <div class="circle"></div>
        </div><div class="circle-clipper right">
          <div class="circle"></div>
        </div>
      </div>
    </div>
</div>`)
}

$("body").addClass("hidden");

$(document).ready(() => {
    $("body").addClass("hidden");
    showPreloader();
    $("body").removeClass("hidden");
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const contest_id = urlParams.get('contest_id');
    if (action == "139")
        replaceContestTaskPage();
    else if (action == "2")
        replaceContestInfoPage();
    else if (action == "140")
        replaceAllSubmissionsPage();
    else if (action == "94")
        replaceStandingsPage();
    else if (action == "142")
        replaceMessagesPage();
    else if (action == "141")
        replaceSendMessagePage();
    else if (action == "37")
        replaceProtocolPage();
    else if (action == "36")
        replaceSubmissionSourcePage();
    else if ((action === undefined || action === null) &&
        (contest_id !== undefined && contest_id !== null))
        replaceLoginPage();
    hidePreloader();
})
