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
                var questionID = getPathPart(result, "stackoverflow.com/questions/", "/");
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
                return getContent(result, "npmjs.com/package/", "", 'https://api.npmjs.org/downloads/point/last-week/', '', function (response) {
                    if (!response) return false;
                    response.json().then(function (data) {
                        result.innerHTML = result.innerHTML + '<div class="snippet" style="font-size: large;">' + data.downloads.toLocaleString() + ' weekly downloads</div>';
                    });
                })
            }

            function addGitHubData(result) {
                return getContent(result, "github.com/", "", 'https://raw.githubusercontent.com/', '/master/README.md', function (response) {
                    if (!response) return false;
                    response.text().then(function (data) {
                        var snippet = '<div class="snippet">';
                        var matches = data.match(/```[\s\S]+?```/g);
                        matches.forEach(match => {
                            if (snippet.split(/\r\n|\r|\n/).length < 20) {
                                match = match.replace(/```/g, '');
                                snippet += '<pre>' + match + '</pre>';
                            }
                        });
                        snippet += '</div>';
                        result.innerHTML += snippet;
                        highlight(result);
                    });
                });
            }

            function getContent(searchResult, sourceUriStart, sourceUriEnd, targetUriStart, targetUriEnd, manipulateData) {
                var part = getPathPart(searchResult, sourceUriStart, sourceUriEnd);
                if (!part) return false;
                fetch(targetUriStart + part + targetUriEnd)
                    .then(
                        function (response) {
                            if (response.status !== 200) {
                                console.log('Looks like there was a ' + sourceUriStart + ' problem. Status Code: ' +
                                    response.status);
                                manipulateData(null);
                            } else {
                                manipulateData(response);
                            }
                        }
                    )
                    .catch(function (err) {
                        console.log('Fetch Error :-S ' + sourceUriStart, err);
                        manipulateData(null);
                    });
                return true;
            }

            function getPathPart(result, start, end) {
                var id;
                try {
                    var href = result.childNodes[0].href;
                    var matches = href.match(start + "(.*)" + end);
                    id = matches[1];
                } catch (e) {
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