import { Audio } from "expo";
import React, { Component } from "react";
import FitImage from "react-native-fit-image";
import { Container, Content, Card, CardItem, Body, Text, Button, Icon, Spinner } from "native-base";
import SearchBar from "../components/SearchBar";
import parser from "../api/DictionaryParser";
import searcher from "../api/SearchWrapper";

const _debug = true;
const logger = (output) => {
  if(_debug) console.log(output);
  else return;
};

//const word = "outline";

export default class WordScreen extends Component {

  state = {
    searchResultArray: null,
    searchImageArray: null,
    searchResultFrom: null
  };

  searchForWord = (word) => {

    let _word = word.replace(" ", "-");

    searcher.searchCambridge(_word).then((searchResultArray) => {
      this.setState({
        searchResultArray: searchResultArray,
        searchResultFrom: "Cambridge"
      });
    })
    .catch((err) => {

      _word = word.replace("-", "%20");
      searcher.searchWikipedia(_word).then((summary) => {
        this.setState({
          searchResultArray: [
            {
              "title": word,
              "meanings": [ {"meaning": summary, "egs": []} ]
            }
          ],
          searchResultFrom: "Wikipedia"
        })
        logger(summary);

      })
      .catch((err) => {
        this.setState({
          searchResultArray: [],
          searchResultFrom: "NotFound"
        });
      });

    });

  }

  searchForImage = (word) => {

    searcher.searchImage(word).then((searchImageArray) => {
      this.setState({ searchImageArray });
    })
    .catch((err) => {
      this.setState({ searchImageArray: [] });
    });

    // Don't use google image anymore
    //let imageUrl = "https://www.google.com.tw/search?q=" + word + "&tbm=isch";
    // Use Bing image
    /*
    const _word = word.replace(" ", "%20");
    let imageUrl = "https://www.bing.com/images/search?q=" + _word;
    logger(imageUrl);

    fetch(imageUrl).then((response) => {
      return response.text();
    })
    .then((text) => {

      let searchImageArray = parser.parseBingImage(text);

      if(searchImageArray.length === 0) {
        logger("Unable to find this image");
      }
      else {
        logger("Get Image Result:")
        logger(searchImageArray);
      }

      this.setState({ searchImageArray });
      logger("* state change");
      logger(this.state.searchImageArray);
    })
    .catch((err) => {
      logger(err);
    });
    */
  }

  playTrack = (url) => {

    let soundObject = new Audio.Sound();

    try {
      soundObject.loadAsync({ uri: "https://dictionary.cambridge.org" + url })
      .then(() => {
        soundObject.playAsync();
      });
    }
    catch(err) {
      logger(err);
    }
  }

  componentDidMount = () => {
    const word = this.props.navigation.getParam("word", "");
    logger("get param: " + word);
    this.searchForWord(word);
    this.searchForImage(word);
  }

  renderWaitingView = () => {
    return (
      <Content padder contentContainerStyle={{ justifyContent: "center", flex: 1 }}>
        <Spinner color="blue" />
      </Content>
    );
  }

  renderNotFoundView = () => {
    return (
      <Content padder contentContainerStyle={{ justifyContent: "center", flex: 1, flexDirection: "row" }}>
        <Button
          bordered
          style={{ alignSelf: "center" }}
          onPress={ () => this.props.navigation.goBack() }>
          <Icon name="ios-arrow-back" />
          <Text>No Match Found</Text>
        </Button>
      </Content>
    );
  }

  renderWikipediaSummary = (wordEntries) => {
    return (
      wordEntries.map((entry, i) => {
        return (
          <Card key={ i }>
            <CardItem header bordered>
              <Text>{ entry.title }</Text>
            </CardItem>
            <CardItem bordered key={ i }>
              <Body>
                <Text>
                  { entry.meanings[0].meaning }
                </Text>
              </Body>
            </CardItem>
          </Card>
        );
      })
    );
  }

  renderMainEntries = (wordEntries) => {
    return (
      wordEntries.map((entry, i) => {
        return (
          <Card key={ i }>

            <CardItem header bordered>
              <Text>{ entry.title }</Text>
            </CardItem>

            <CardItem bordered>
              <Text>{ entry.pos }{ entry.gram }  </Text>
              <Text>/{ entry.pron }/</Text>
              <Button transparent onPress={ () => this.playTrack(entry.mp3) }>
                <Icon name="ios-volume-up" />
              </Button>
            </CardItem>

            { this.renderMeanings(entry.meanings) }

          </Card>
        )
      })
    );
  }

  renderMeanings = (meanings) => {
    return (
      meanings.map((entry, i) => {
        return (
          <CardItem bordered key={ i }>
            <Body>
              <Text style={{ fontWeight: "bold" }}>{ entry.meaning }</Text>

              { this.renderExamples(entry.egs) }

            </Body>
          </CardItem>
        )
      })
    );
  }

  renderExamples = (examples) => {
    return (
      examples.map((entry, i) => {
        return (
          <Text style={{ fontStyle: "italic" }} key={ i }>{ entry }</Text>
        )
      })
    );
  }

  renderImages = (images) => {
    return (
      <Card>
      {
        images.map((entry, i) => {
          logger("render " + entry)
          return (
            <FitImage key={i}
              resizeMode="contain"
              style={{ margin: 10 }}
              source={{ uri: entry }}/>
          )
        })
      }
      </Card>
    );
  }

  goToPrevPage = () => {
    this.props.navigation.goBack();
  }

  render() {
    const result = this.state.searchResultArray;
    const images = this.state.searchImageArray;
    const resultFrom = this.state.searchResultFrom;

    //if(result == null || images == null) {
    // FIX ME images should have a switch to decide whether to render or not
    if(resultFrom == null || images == null) {
      return (
        <Container>
          { this.renderWaitingView() }
        </Container>
      );
    }
    //else if(result.length === 0) {
    else if(resultFrom === "NotFound") {
      return (
        <Container>
          { this.renderNotFoundView() }
        </Container>
      );
    }
    //else {
    else if(resultFrom === "Cambridge") {
      logger("Can Render Result Now.");
      logger(result);
      return (
        <Container>
          <Content padder>

          <SearchBar
            inputWord={ this.props.navigation.getParam("word", "") }
            setInputWordFromSearchBar={ () => {} }
            determineSelectedWord={ () => {} }
            onFocus={ this.goToPrevPage }
          />

          { this.renderMainEntries(result) }

          { this.renderImages(images) }

          </Content>
        </Container>
      )
    }
    else if(resultFrom === "Wikipedia") {
      logger("Can Render Result Now. (from wiki)");
      logger(result);
      return (
        <Container>
          <Content padder>

          <SearchBar
            inputWord={ this.props.navigation.getParam("word", "") }
            setInputWordFromSearchBar={ () => {} }
            determineSelectedWord={ () => {} }
            onFocus={ this.goToPrevPage }
          />

          { this.renderWikipediaSummary(result) }

          { this.renderImages(images) }

          </Content>
        </Container>
      )
    }
    // FIX ME is it necessary?
    else {
      return (
        <Container>
          { this.renderNotFoundView() }
        </Container>
      );
    }
  }
}
