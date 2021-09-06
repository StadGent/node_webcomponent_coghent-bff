import { SearchFilter } from "./type-defs"

  function searchMetadata(searchValue: SearchFilter) {
    return `{
            "query": {
              "nested": {
                "path": "metadata",
                "query": {
                  "bool": {
                    "must": [
                      {
                        "match": {
                          "metadata.value": "${searchValue.value}"
                        }
                      }
                    ]
                  }
                }
              }
            }
          }`
  }

function sortOnQuery(searchValue: SearchFilter) {
  let order = "asc";
  if (!searchValue.isAsc) order = "desc"

  return `{
          "sort": [
            {
              "metadata.value": {
                "order": "${order}",
                "nested": {
                  "path": "metadata",
                  "filter": {
                    "match": {
                      "metadata.key": "${searchValue.key}"
                    }
                  }
                }
              }
            }
          ],
          "query": {
            "nested": {
              "path": "metadata",
              "query": {
                "bool": {
                  "must": [
                    {
                      "match": {
                        "metadata.value": "${searchValue.value}"
                      }
                    }
                  ]
                }
              }
            }
          }
        }`
  }

  function getAllAssets() {
    return `{
            "query": {
              "term": {
                "type": "asset"
              }
            }
          }`
  }

  export function getQuery(searchValue: SearchFilter) {
    if(searchValue.raw === true && searchValue.value){
      return searchValue.value
    }

    if (searchValue.value != "") {
      if (searchValue.key) {
        return sortOnQuery(searchValue);
      }
      return searchMetadata(searchValue);
    }
    return getAllAssets()
  }