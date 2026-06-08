import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "./src/components/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./src/components/Card";
import Input from "./src/components/Input";

const DICTIONARY_API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en";

type DictionaryPhonetic = {
  text?: string;
  audio?: string;
  sourceUrl?: string;
};

type DictionaryDefinition = {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
};

type DictionaryMeaning = {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
};

type DictionaryEntry = {
  word: string;
  phonetic?: string;
  phonetics?: DictionaryPhonetic[];
  meanings?: DictionaryMeaning[];
};

type AudioOption = {
  label: string;
  phoneticText?: string;
  url: string;
};

function getFriendlyError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      return "Word not found. Check the spelling and try another word.";
    }

    if (!error.response) {
      return "Network error. Please check your connection and try again.";
    }

    return "The dictionary service could not complete this request. Please try again.";
  }

  return "Something went wrong while loading the word. Please try again.";
}

function getAudioRegion(url: string) {
  const normalized = url.toLowerCase();

  if (normalized.includes("-us") || normalized.includes("us.mp3")) {
    return "US";
  }

  if (normalized.includes("-uk") || normalized.includes("uk.mp3")) {
    return "UK";
  }

  return "Audio";
}

function normalizeAudioUrl(url: string) {
  const trimmedUrl = url.trim();

  if (trimmedUrl.startsWith("//")) {
    return `https:${trimmedUrl}`;
  }

  if (trimmedUrl.startsWith("http://")) {
    return trimmedUrl.replace("http://", "https://");
  }

  return trimmedUrl;
}

function getAudioOptions(phonetics: DictionaryPhonetic[]) {
  const options = new Map<string, AudioOption>();

  phonetics.forEach((phonetic, index) => {
    const url = normalizeAudioUrl(phonetic.audio ?? "");

    if (!url || options.has(url)) {
      return;
    }

    const region = getAudioRegion(url);
    const phoneticText = phonetic.text?.trim();
    const fallbackLabel = region === "Audio" ? `Audio ${index + 1}` : region;

    options.set(url, {
      label: phoneticText ? `${fallbackLabel} ${phoneticText}` : fallbackLabel,
      phoneticText,
      url
    });
  });

  return [...options.values()];
}

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [inputError, setInputError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedAudioIndex, setSelectedAudioIndex] = useState(0);
  const [playbackMessage, setPlaybackMessage] = useState("");

  const entry = entries[0];
  const allPhonetics = useMemo(() => entries.flatMap((wordEntry) => wordEntry.phonetics ?? []), [entries]);
  const allMeanings = useMemo(() => entries.flatMap((wordEntry) => wordEntry.meanings ?? []), [entries]);
  const definitionCount = useMemo(
    () => allMeanings.reduce((total, meaning) => total + meaning.definitions.length, 0),
    [allMeanings]
  );
  const phoneticText =
    entry?.phonetic || allPhonetics.find((phonetic) => phonetic.text)?.text || "";
  const audioOptions = useMemo(() => getAudioOptions(allPhonetics), [allPhonetics]);
  const selectedAudioUrl = audioOptions[selectedAudioIndex]?.url ?? null;
  const audioPlayer = useAudioPlayer(selectedAudioUrl, { updateInterval: 250 });
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  useEffect(() => {
    setAudioModeAsync({
      interruptionMode: "duckOthers",
      playsInSilentMode: true,
      shouldRouteThroughEarpiece: false
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    setPlaybackMessage("");
  }, [selectedAudioUrl]);

  async function searchWord(wordToSearch = searchTerm) {
    const cleanedWord = wordToSearch.trim();

    if (!cleanedWord) {
      setInputError("Enter an English word to search.");
      setErrorMessage("");
      return;
    }

    Keyboard.dismiss();
    setInputError("");
    setErrorMessage("");
    setPlaybackMessage("");
    setIsLoading(true);
    setSelectedAudioIndex(0);

    try {
      audioPlayer.pause();
      await audioPlayer.seekTo(0).catch(() => undefined);
      const requestUrl = `${DICTIONARY_API_URL}/${encodeURIComponent(cleanedWord.toLowerCase())}`;
      const response = await axios.get<DictionaryEntry[]>(requestUrl);
      const nextEntries = Array.isArray(response.data) ? response.data : [];

      if (!nextEntries.length) {
        setEntries([]);
        setErrorMessage("No dictionary data was returned for this word.");
        return;
      }

      const resolvedWord = nextEntries[0]?.word || cleanedWord;
      setEntries(nextEntries);
      setSearchTerm(resolvedWord);
      setHistory((currentHistory) => {
        const withoutDuplicate = currentHistory.filter(
          (historyWord) => historyWord.toLowerCase() !== resolvedWord.toLowerCase()
        );

        return [resolvedWord, ...withoutDuplicate].slice(0, 12);
      });
    } catch (error) {
      setEntries([]);
      setErrorMessage(getFriendlyError(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleAudioPlayback() {
    if (!selectedAudioUrl) {
      return;
    }

    setPlaybackMessage("");

    if (audioStatus.playing) {
      audioPlayer.pause();
      return;
    }

    if (audioStatus.error) {
      setPlaybackMessage("This pronunciation audio could not be loaded. Try another audio option.");
      return;
    }

    if (audioStatus.didJustFinish || (audioStatus.duration > 0 && audioStatus.currentTime >= audioStatus.duration)) {
      await audioPlayer.seekTo(0).catch(() => undefined);
    }

    try {
      audioPlayer.play();
    } catch {
      setPlaybackMessage("Audio playback failed. Try another word or audio option.");
    }
  }

  async function stopAudioPlayback() {
    audioPlayer.pause();
    await audioPlayer.seekTo(0).catch(() => undefined);
  }

  async function selectAudio(index: number) {
    setSelectedAudioIndex(index);
    setPlaybackMessage("");
    audioPlayer.pause();
    await audioPlayer.seekTo(0).catch(() => undefined);
  }

  function removeHistoryWord(wordToRemove: string) {
    setHistory((currentHistory) =>
      currentHistory.filter((historyWord) => historyWord.toLowerCase() !== wordToRemove.toLowerCase())
    );
  }

  function clearHistory() {
    setHistory([]);
  }

  function renderEmptyState() {
    if (isLoading) {
      return (
        <Card>
          <CardContent style={styles.loadingState}>
            <ActivityIndicator color="#6366f1" size="large" />
            <Text style={styles.mutedText}>Searching the dictionary...</Text>
          </CardContent>
        </Card>
      );
    }

    if (errorMessage) {
      return (
        <Card style={styles.feedbackCard}>
          <CardContent style={styles.feedbackContent}>
            <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
            <Text style={styles.feedbackTitle}>{errorMessage}</Text>
            <Button disabled={!searchTerm.trim()} onPress={() => searchWord()}>
              Retry search
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (!entry) {
      return (
        <Card>
          <CardContent style={styles.feedbackContent}>
            <Ionicons name="book-outline" size={40} color="#6366f1" />
            <Text style={styles.feedbackTitle}>Search a word to view meanings and examples.</Text>
          </CardContent>
        </Card>
      );
    }

    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <Modal animationType="fade" transparent visible={isDrawerOpen} onRequestClose={() => setIsDrawerOpen(false)}>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <View>
                <Text style={styles.eyebrow}>Navigation</Text>
                <Text style={styles.drawerTitle}>Search History</Text>
              </View>
              <Pressable accessibilityRole="button" style={styles.iconButton} onPress={() => setIsDrawerOpen(false)}>
                <Ionicons name="close" size={24} color="#475569" />
              </Pressable>
            </View>

            {history.length ? (
              <>
                <Pressable accessibilityRole="button" style={styles.clearHistoryButton} onPress={clearHistory}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <Text style={styles.clearHistoryText}>Clear all history</Text>
                </Pressable>
                <ScrollView contentContainerStyle={styles.historyList}>
                  {history.map((historyWord) => (
                    <View key={historyWord.toLowerCase()} style={styles.historyItem}>
                      <Pressable
                        accessibilityRole="button"
                        style={styles.historyWordButton}
                        onPress={() => {
                          setIsDrawerOpen(false);
                          searchWord(historyWord);
                        }}
                      >
                        <Ionicons name="time-outline" size={22} color="#6366f1" />
                        <Text style={styles.historyWord}>{historyWord}</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        style={styles.deleteHistoryButton}
                        onPress={() => removeHistoryWord(historyWord)}
                      >
                        <Ionicons name="close" size={20} color="#ef4444" />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              </>
            ) : (
              <View style={styles.drawerEmpty}>
                <Text style={styles.mutedText}>Your successful searches will appear here.</Text>
              </View>
            )}
          </View>
          <Pressable style={styles.drawerScrim} onPress={() => setIsDrawerOpen(false)} />
        </View>
      </Modal>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.shell}>
        <View style={styles.topbar}>
          <Pressable accessibilityRole="button" style={styles.iconButton} onPress={() => setIsDrawerOpen(true)}>
            <Ionicons name="menu" size={26} color="#475569" />
          </Pressable>
          <View style={styles.brandBlock}>
            <Text style={styles.eyebrow}>LexiTech Dictionary</Text>
            <Text style={styles.title}>Dictionary</Text>
          </View>
          {history.length ? (
            <View style={styles.historyBadge}>
              <Ionicons name="time-outline" size={18} color="#6366f1" />
              <Text style={styles.historyBadgeText}>{history.length}</Text>
            </View>
          ) : null}
        </View>

        <Card style={styles.searchCard}>
          <CardHeader>
            <CardTitle>Find a Word</CardTitle>
          </CardHeader>
          <CardContent style={styles.searchForm}>
            <Input
              autoCapitalize="none"
              autoCorrect={false}
              error={inputError}
              label="English word"
              placeholder="Example: innovation"
              returnKeyType="search"
              value={searchTerm}
              onChangeText={(text) => {
                setSearchTerm(text);
                if (inputError) {
                  setInputError("");
                }
              }}
              onSubmitEditing={() => searchWord()}
            />
            <View style={styles.searchActions}>
              <View style={styles.searchButtonWrap}>
                <Button disabled={!searchTerm.trim()} isLoading={isLoading} onPress={() => searchWord()}>
                  Search
                </Button>
              </View>
              {searchTerm ? (
                <Pressable
                  accessibilityRole="button"
                  style={styles.clearButton}
                  onPress={() => {
                    setSearchTerm("");
                    setInputError("");
                    setErrorMessage("");
                    setEntries([]);
                    setPlaybackMessage("");
                  }}
                >
                  <Ionicons name="close-circle-outline" size={24} color="#64748b" />
                </Pressable>
              ) : null}
            </View>
          </CardContent>
        </Card>

        {renderEmptyState()}

        {entry ? (
          <View style={styles.results}>
            <Card style={styles.wordCard}>
              <CardContent style={styles.wordHeader}>
                <View style={styles.wordTitleBlock}>
                  <Text style={styles.word}>{entry.word}</Text>
                  {phoneticText ? <Text style={styles.phonetic}>{phoneticText}</Text> : null}
                  <View style={styles.summaryChips}>
                    <View style={styles.summaryChip}>
                      <Text style={styles.summaryChipText}>{allMeanings.length} meanings</Text>
                    </View>
                    <View style={styles.summaryChip}>
                      <Text style={styles.summaryChipText}>{definitionCount} definitions</Text>
                    </View>
                    {audioOptions.length ? (
                      <View style={styles.summaryChip}>
                        <Text style={styles.summaryChipText}>{audioOptions.length} audio</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {selectedAudioUrl ? (
                  <View style={styles.audioPanel}>
                    <View style={styles.audioButtons}>
                      <Pressable accessibilityRole="button" style={styles.audioButton} onPress={toggleAudioPlayback}>
                        <Ionicons
                          name={audioStatus.playing ? "pause" : "volume-high-outline"}
                          size={22}
                          color="#ffffff"
                        />
                      </Pressable>
                      <Pressable accessibilityRole="button" style={styles.stopButton} onPress={stopAudioPlayback}>
                        <Ionicons name="stop" size={20} color="#475569" />
                      </Pressable>
                    </View>

                    {playbackMessage || audioStatus.error ? (
                      <Text style={styles.audioError}>
                        {playbackMessage || "This pronunciation audio could not be loaded."}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </CardContent>

              {audioOptions.length > 1 ? (
                <CardContent style={styles.pronunciationArea}>
                  <Text style={styles.sectionLabel}>Pronunciations</Text>
                  <View style={styles.audioChoices}>
                    {audioOptions.map((option, index) => (
                      <Pressable
                        accessibilityRole="button"
                        key={option.url}
                        style={[styles.audioChoice, selectedAudioIndex === index && styles.audioChoiceActive]}
                        onPress={() => selectAudio(index)}
                      >
                        <Ionicons
                          name={selectedAudioIndex === index ? "radio-button-on" : "radio-button-off"}
                          size={18}
                          color={selectedAudioIndex === index ? "#6366f1" : "#94a3b8"}
                        />
                        <Text
                          style={[
                            styles.audioChoiceText,
                            selectedAudioIndex === index && styles.audioChoiceTextActive
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </CardContent>
              ) : null}
            </Card>

            {allMeanings.length ? (
              allMeanings.map((meaning, meaningIndex) => (
                <Card key={`${meaning.partOfSpeech}-${meaningIndex}`}>
                  <CardHeader style={styles.meaningHeader}>
                    <Text style={styles.partOfSpeech}>{meaning.partOfSpeech}</Text>
                    <Text style={styles.definitionCountText}>
                      {meaning.definitions.length} {meaning.definitions.length === 1 ? "definition" : "definitions"}
                    </Text>
                  </CardHeader>
                  <CardContent style={styles.definitionList}>
                    {meaning.definitions.map((definition, definitionIndex) => (
                      <View key={`${definition.definition}-${definitionIndex}`} style={styles.definitionItem}>
                        <Text style={styles.definitionNumber}>{definitionIndex + 1}</Text>
                        <View style={styles.definitionTextBlock}>
                          <Text style={styles.definitionText}>{definition.definition}</Text>
                          {definition.example ? (
                            <Text style={styles.exampleText}>&quot;{definition.example}&quot;</Text>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent style={styles.feedbackContent}>
                  <Text style={styles.feedbackTitle}>No definitions are available for this word.</Text>
                </CardContent>
              </Card>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#f8fafc",
    flex: 1
  },
  shell: {
    gap: 20,
    padding: 20,
    paddingBottom: 40
  },
  topbar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    marginBottom: 8
  },
  brandBlock: {
    flex: 1
  },
  eyebrow: {
    color: "#6366f1",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: "uppercase"
  },
  title: {
    color: "#0f172a",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 38
  },
  historyBadge: {
    alignItems: "center",
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    flexDirection: "row",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    shadowColor: "#6366f1",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2
  },
  historyBadgeText: {
    color: "#6366f1",
    fontSize: 15,
    fontWeight: "900"
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    width: 48,
    shadowColor: "#1e293b",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  searchCard: {
    backgroundColor: "#ffffff"
  },
  searchForm: {
    gap: 16
  },
  searchActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  searchButtonWrap: {
    flex: 1
  },
  clearButton: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    width: 48,
    shadowColor: "#000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  loadingState: {
    alignItems: "center",
    gap: 16,
    paddingTop: 24,
    paddingBottom: 24
  },
  mutedText: {
    color: "#64748b",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600"
  },
  feedbackCard: {
    backgroundColor: "#fef2f2"
  },
  feedbackContent: {
    alignItems: "center",
    gap: 16,
    paddingTop: 24,
    paddingBottom: 24
  },
  feedbackTitle: {
    color: "#475569",
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 25,
    textAlign: "center",
    letterSpacing: 0.2
  },
  results: {
    gap: 20
  },
  wordCard: {
    backgroundColor: "#ffffff",
    borderLeftWidth: 4,
    borderLeftColor: "#6366f1"
  },
  wordHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    paddingTop: 24
  },
  wordTitleBlock: {
    flex: 1,
    gap: 8
  },
  word: {
    color: "#0f172a",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -0.5,
    textTransform: "capitalize"
  },
  phonetic: {
    color: "#64748b",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.3
  },
  summaryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12
  },
  summaryChip: {
    backgroundColor: "#eef2ff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#c7d2fe"
  },
  summaryChipText: {
    color: "#6366f1",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3
  },
  audioPanel: {
    alignItems: "flex-end",
    gap: 12
  },
  audioButtons: {
    flexDirection: "row",
    gap: 10
  },
  audioButton: {
    alignItems: "center",
    backgroundColor: "#6366f1",
    borderRadius: 14,
    height: 54,
    justifyContent: "center",
    width: 54,
    shadowColor: "#6366f1",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  stopButton: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    height: 54,
    justifyContent: "center",
    width: 54,
    shadowColor: "#000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  pronunciationArea: {
    borderTopColor: "#e2e8f0",
    borderTopWidth: 1,
    gap: 14,
    paddingTop: 20,
    marginTop: 8
  },
  sectionLabel: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  audioChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-start"
  },
  audioChoice: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "#e2e8f0"
  },
  audioChoiceActive: {
    backgroundColor: "#eef2ff",
    borderColor: "#6366f1"
  },
  audioChoiceText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2
  },
  audioChoiceTextActive: {
    color: "#6366f1"
  },
  audioError: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    maxWidth: 160,
    textAlign: "right"
  },
  meaningHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  partOfSpeech: {
    alignSelf: "flex-start",
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    color: "#15803d",
    fontSize: 16,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 10,
    textTransform: "capitalize",
    borderWidth: 1,
    borderColor: "#bbf7d0"
  },
  definitionCountText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3
  },
  definitionList: {
    gap: 20
  },
  definitionItem: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 14
  },
  definitionNumber: {
    backgroundColor: "#eef2ff",
    borderRadius: 10,
    color: "#6366f1",
    fontSize: 15,
    fontWeight: "900",
    minWidth: 34,
    overflow: "hidden",
    paddingVertical: 8,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#c7d2fe"
  },
  definitionTextBlock: {
    flex: 1,
    gap: 10
  },
  definitionText: {
    color: "#1e293b",
    fontSize: 17,
    lineHeight: 26,
    fontWeight: "500",
    letterSpacing: 0.2
  },
  exampleText: {
    color: "#64748b",
    fontSize: 16,
    fontStyle: "italic",
    lineHeight: 24,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#cbd5e1"
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: "row"
  },
  drawerScrim: {
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    flex: 1
  },
  drawer: {
    backgroundColor: "#ffffff",
    elevation: 16,
    height: "100%",
    padding: 22,
    shadowColor: "#0f172a",
    shadowOffset: { height: 0, width: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    width: 320
  },
  drawerHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    marginBottom: 24
  },
  drawerTitle: {
    color: "#0f172a",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.3
  },
  clearHistoryButton: {
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 16,
    minHeight: 50,
    shadowColor: "#ef4444",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2
  },
  clearHistoryText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3
  },
  historyList: {
    gap: 12,
    paddingBottom: 28
  },
  historyItem: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    flexDirection: "row",
    gap: 12,
    minHeight: 60,
    paddingLeft: 16,
    paddingRight: 8,
    shadowColor: "#1e293b",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2
  },
  historyWordButton: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 60
  },
  historyWord: {
    color: "#0f172a",
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    textTransform: "capitalize",
    letterSpacing: 0.2
  },
  deleteHistoryButton: {
    alignItems: "center",
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  drawerEmpty: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 20
  }
});
