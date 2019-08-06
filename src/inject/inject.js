chrome.extension.sendMessage({}, function (response) {
    var readyStateCheckInterval = setInterval(function () {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);

            // ----------------------------------------------------------
            // This part of the script triggers when page is done loading

            getSearchResults();

            function getSearchResults() {
                var htmlResults = document.getElementsByClassName("r");
                // console.log(htmlResults); //for debugging
                for (var result of htmlResults) {
                    if (
                        addNpmData(result) ||
                        addStackOverflowData(result) ||
                        addGitHubData(result)
                    ) continue;
                }
            }

            function addStackOverflowData(result) {
                var questionID = getResultID(result, "stackoverflow.com/questions/", "/");
                if (!questionID) return false;

                fetch('https://api.stackexchange.com/2.2/questions/' + questionID + '/answers?&site=stackoverflow&filter=withbody&sort=votes')
                    .then(
                        function (response) {
                            if (response.status !== 200) {
                                console.log('Looks like there was a getStackOverflowData problem. Status Code: ' +
                                    response.status);
                                return;
                            }

                            // Manipulate the text in the response
                            response.json().then(function (data) {
                                var snippet = "No answers";
                                if (data.items.length) {
                                    snippet = data.items[0].body;
                                }
                                result.innerHTML = result.innerHTML + '<div  class="snippet" >' + snippet + '</div>';
                                highlight(result);
                            });
                        }
                    )
                    .catch(function (err) {
                        console.log('Fetch Error :-S', err);
                    });
            }

            function addNpmData(result) {
                var packageName = getResultID(result, "npmjs.com/package/", '');
                if (!packageName) return false;
                fetch('https://api.npmjs.org/downloads/point/last-week/' + packageName)
                    .then(
                        function (response) {
                            if (response.status !== 200) {
                                console.log('Looks like there was a getNpmData problem. Status Code: ' +
                                    response.status);
                                return;
                            }

                            // Manipulate the text in the response
                            response.json().then(function (data) {
                                result.innerHTML = result.innerHTML + '<div class="snippet" style="font-size: large;">' + data.downloads.toLocaleString() + ' weekly downloads</div>';
                            });
                        }
                    )
                    .catch(function (err) {
                        console.log('Fetch Error :-S', err);
                    });
            }

            function addGitHubData(result) {
                var repo = getResultID(result, "github.com/", "");
                if (!repo) return false;
                var mdUrl = 'https://raw.githubusercontent.com/' + repo + '/master/README.md';
                fetch(mdUrl)
                    .then(
                        function (response) {
                            if (response.status !== 200) {
                                console.log('Looks like there was a getGithubData problem. Status Code: ' +
                                    response.status);
                                return;
                            }

                            // Manipulate the text in the response
                            response.text().then(function (data) {
                                var matches = data.match(/```[^"]*```/);
                                var snippet = matches[0];
                                result.innerHTML = result.innerHTML + '<div  class="snippet" ><pre>' + snippet + '</pre></div>';
                                highlight(result);
                            });
                        }
                    )
                    .catch(function (err) {
                        console.log('Fetch Error :-S', err);
                    });
            }

            function getResultID(result, start, end) {
                var id;
                try {
                    var href = result.childNodes[0].href;
                    var matches = href.match(start + "(.*)" + end);
                    id = matches[1];
                } catch (e) {
                    // console.log(result);
                    // console.log(start);
                    // console.log(end);
                    // console.log(e);
                    return null;
                }
                return id;
            }

            function highlight(block) {
                var children = block.querySelectorAll("*");
                children.forEach(element => {
                    if (element.localName === 'pre' || element.localName === 'code') {
                        hljs.highlightBlock(element);
                    }
                });
            }
        }
    }, 10);
});