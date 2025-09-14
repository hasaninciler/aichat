import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  time: string;
  isThinking?: boolean;
};


const geminiAPI = async (message: string): Promise<string> => {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.EXPO_PUBLIC_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: message
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.8
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return text || 'Cvap veriliyor...';

  } catch (error) {
    return 'Şu anda bağlantı Kurulamıyor.';
  }
};

export default function AIChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      text: 'Merhaba! Ben Hasan. Size nasıl yardımcı olabilirim?',
      isUser: false,
      time: new Date().toLocaleTimeString()
    };
    setMessages([welcomeMessage]);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true
    }).start();
  }, []);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      time: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    const thinkingMessage: Message = {
      id: 'thinking-' + Date.now(),
      text: 'Düşünüyorumm...',
      isUser: false,
      isThinking: true,
      time: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, thinkingMessage]);

    try {
      const aiResponse = await geminiAPI(inputText);

      const aiMessage: Message = {
        id: Date.now().toString(),
        text: aiResponse,
        isUser: false,
        time: new Date().toLocaleTimeString()
      };

      setMessages(prev => prev.filter(msg => !msg.isThinking).concat(aiMessage));

    } catch (error) {
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        text: 'Şu anda cevap verilemiyor.',
        isUser: false,
        time: new Date().toLocaleTimeString()
      };

      setMessages(prev => prev.filter(msg => !msg.isThinking).concat(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <Animated.View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.aiMessage,
        { opacity: fadeAnim }
      ]}
    >
      <View style={styles.messageContent}>
        <Text style={[
          styles.messageText,
          item.isUser ? styles.userMessageText : styles.aiMessageText
        ]}>
          {item.text}
        </Text>

        {item.isThinking ? (
          <View style={styles.thinkingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.thinkingText}>İşte Yanıtm...</Text>
          </View>
        ) : (
          <Text style={styles.timeText}>
            {item.time} • {item.isUser ? 'Siz' : 'Hasan'}
          </Text>
        )}
      </View>
    </Animated.View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>Hasan</Text>
        <Text style={styles.headerStatus}>🟢 Çevrimiçi</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {renderHeader()}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Bana soru sor"
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isLoading) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Ionicons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>


    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerStatus: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 2,
  },
  messageList: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  messageListContent: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 8,
  },
  messageContent: {
    flex: 1,
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    padding: 14,
    borderRadius: 20,
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    backgroundColor: '#007AFF',
    color: 'white',
    borderBottomRightRadius: 6,
  },
  aiMessageText: {
    backgroundColor: '#FFFFFF',
    color: '#000',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  thinkingText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F3F4',
    padding: 14,
    borderRadius: 22,
    fontSize: 16,
    maxHeight: 120,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#DADCE0',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9AA0A6',
  },
  footer: {
    padding: 8,
    backgroundColor: '#F8F9FA',
  },
  footerText: {
    fontSize: 12,
    color: '#5F6368',
    textAlign: 'center',
  },
});
