/* CubeBraid search adjustments for Chinese documentation. */
(function () {
  const defaultSplitQuery = (query) => query
    .split(/[^\p{Letter}\p{Number}_\p{Emoji_Presentation}]+/gu)
    .filter((term) => term);
  const chineseOnly = /^\p{Script=Han}+$/u;

  // Use the terms actually emitted by the Chinese search index to split a
  // query. This makes a phrase such as "产品与能力" searchable even though
  // browsers do not provide the same jieba tokenizer as the Sphinx builder.
  if (typeof Search !== "undefined") {
    splitQuery = function (query) {
      const chunks = defaultSplitQuery(query);
      const index = Search._index;
      if (!index) return chunks;

      const dictionary = new Set([
        ...Object.keys(index.terms || {}),
        ...Object.keys(index.titleterms || {}),
      ].filter((term) => chineseOnly.test(term) && [...term].length > 1));

      const splitChineseChunk = (chunk) => {
        const characters = [...chunk];
        const words = [];
        let offset = 0;
        while (offset < characters.length) {
          let match = "";
          for (let end = characters.length; end > offset; end -= 1) {
            const candidate = characters.slice(offset, end).join("");
            if (dictionary.has(candidate)) {
              match = candidate;
              break;
            }
          }
          if (match) {
            words.push(match);
            offset += [...match].length;
          } else {
            // Single Chinese characters are filtered from the Sphinx index;
            // skip them so they do not make an otherwise valid query fail.
            offset += 1;
          }
        }
        return words.length ? words : [chunk];
      };

      return chunks.flatMap((chunk) => (
        chineseOnly.test(chunk) ? splitChineseChunk(chunk) : [chunk]
      ));
    };
  }

  // Sphinx's title matching requires a query to cover at least half of the
  // title. That is too restrictive for short Chinese queries such as "产品".
  if (typeof Search !== "undefined" && Search._performSearch) {
    const originalPerformSearch = Search._performSearch;

    Search._performSearch = function (query, searchTerms, excludedTerms, highlightTerms, objectTerms) {
      const results = originalPerformSearch(
        query,
        searchTerms,
        excludedTerms,
        highlightTerms,
        objectTerms,
      );
      const queryLower = query.toLowerCase().trim();
      const index = Search._index;

      if (queryLower && /\p{Script=Han}/u.test(queryLower) && index && index.alltitles) {
        const resultKeys = new Set(
          results.map((result) => `${result[0]}|${result[2]}|${result[5]}`),
        );

        Object.entries(index.alltitles).forEach(([title, foundTitles]) => {
          if (!title.toLowerCase().includes(queryLower)) return;

          foundTitles.forEach(([file, id]) => {
            const result = [
              index.docnames[file],
              index.titles[file] !== title ? `${index.titles[file]} > ${title}` : title,
              id !== null ? `#${id}` : "",
              null,
              15,
              index.filenames[file],
              SearchResultKind.title,
            ];
            const resultKey = `${result[0]}|${result[2]}|${result[5]}`;
            if (!resultKeys.has(resultKey)) {
              results.push(result);
              resultKeys.add(resultKey);
            }
          });
        });
      }

      // Search results should follow the documentation's reading path after
      // direct title hits. Sphinx normally breaks score ties by internal file
      // name, which can put chapters 5/6 ahead of chapter 4.
      const navigationOrder = [
        'System-Architecture',
        'SDK-Architecture',
        'About-CubeBraid',
        'Library-Export',
        'Get-Started',
        'Get-Started/Installation',
        'Get-Started/Quickstart',
        'API-Reference',
        'API/AGV',
        'API/Camera',
        'API/DL',
        'API/Kawasaki',
        'API/Robot',
        'API/PLC',
        'API/Sensor',
        'API/Json',
        'API/Logger',
        'Integration-and-Deployment',
        'Guides/Python-Integration',
        'Guides/System-Integration',
        'Guides/Deployment',
        'Developer-Tools',
        'R2C-Integration',
        'R2C/Overview',
        'R2C/Python',
        'R2C/Cpp',
        'R2C/Configuration',
        'R2C/Safety-and-Troubleshooting',
        'Guides/Configuration',
        'Guides/Safety',
        'Releases',
        'Migration-and-Upgrades',
        'Contact',
      ];
      const navigationRank = new Map(
        navigationOrder.map((docname, position) => [docname, position]),
      );
      const docRank = (result) => navigationRank.get(result[0]) ?? Number.MAX_SAFE_INTEGER;
      const isDirectTitleMatch = (result) => (
        String(result[1] || '').toLowerCase().includes(queryLower)
      );
      const compareForDisplay = (left, right) => {
        const titleMatchDifference = Number(isDirectTitleMatch(right)) - Number(isDirectTitleMatch(left));
        if (titleMatchDifference) return titleMatchDifference;

        const navigationDifference = docRank(left) - docRank(right);
        if (navigationDifference) return navigationDifference;

        const scoreDifference = right[4] - left[4];
        if (scoreDifference) return scoreDifference;

        return String(left[0]).localeCompare(String(right[0]));
      };

      // Search displays results with ``pop()``, so keep the highest-priority
      // item at the end of the array.
      results.sort((left, right) => compareForDisplay(right, left));

      return results;
    };
  }

  // The bundled Sphinx catalog uses an older plural message key. Translate
  // the current singular/plural messages explicitly for the Chinese site.
  if (typeof Documentation !== "undefined" && Documentation.ngettext) {
    const originalNgettext = Documentation.ngettext.bind(Documentation);
    Documentation.ngettext = function (singular, plural, count) {
      if (
        singular === "Search finished, found one page matching the search query." ||
        plural === "Search finished, found ${resultCount} pages matching the search query."
      ) {
        return `搜索完成，找到 ${count} 个匹配的页面。`;
      }
      return originalNgettext(singular, plural, count);
    };
  }
})();
