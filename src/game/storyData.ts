import { AIStoryPayload, VictorySongData } from './types';

/**
 * Pre-built, instant-loading 1984 Haveli Backstory (zero network calls or mobile loading delays).
 */
export const BUILT_IN_STORY: AIStoryPayload = {
  title: '1984 Ki Kaali Raat — The Curse of the Haveli',
  year: 'OCTOBER 1984',
  chapters: [
    {
      heading: 'Laal Jode Mein Adhoora Vivaah',
      hindiQuote: 'लाल जोड़े में उसकी पायल आखिरी बार इस आँगन में गूँजी थी...',
      narration:
        'October 1984 ki amavasya raat thi. Is purani haveli ke Aangan mein dulhan Meera ka havan chal raha tha — par lalach aur dhokhe ne sab kuch ujaad diya. Pheron se theek pehle havan adhoora chhod diya gaya aur usey laal saree mein isi andheri haveli ke andar band kar diya gaya.',
      moodCue: 'Tragic Betrayal · 1984',
    },
    {
      heading: 'Chaar Kaale Bandhan Aur 3 Baje Ki Payal',
      hindiQuote: 'जब तक आखिरी आहुति नहीं पड़ेगी, मैं किसी को यहाँ से जाने नहीं दूँगी...',
      narration:
        'Us raat ke baad haveli ke saare diye bujh gaye. Parivaar ne dar ke maare chaar laal tantrik bandhan (Cursed Seals) laga diye taaki uski aatma bahar na nikal sake. Tab se har raat 3 baje uski chandi ki payal in baramadon mein goonjti hai — jo bhi torch jalakar aata hai, woh usse apna gunehgaar samajhti hai.',
      moodCue: 'Haunted Curse · 3:00 AM',
    },
    {
      heading: 'Paanch Adhyay — Moksha Ka Aakhiri Raasta',
      hindiQuote: 'पाँच परीक्षाएँ पार करो... आखिरी हवन पूरा करो... मुझे मुक्ति दिलाओ...',
      narration:
        'Pandit ji ke aakhiri nirdesh ke anusaar, is shraap ko todne ke liye aapko 5 alag-alag kaam poore karne honge: 5 bujhe diye jalana, 1984 ke raaz padhna, 4 mandir ki ghantiyan sahi kram mein bajana, 4 kaale bandhan todna, aur aakhir mein 4 pavitra samagri se Aakhiri Havan poora karna. Tabhi uski aatma ko Moksha aur Shanti milegi.',
      moodCue: 'Your 5-Chapter Mission',
    },
  ],
};

/**
 * Pre-built Original Victory Ghost Song ("Moksha Geet — Aakhiri Shanti").
 * Plays immediately upon completing Chapter 5 with built-in Indian Raga Bhairavi -> Raga Yaman
 * Sitar, Bansuri, Tanpura, Manjira, and Ethereal Female Vocal Alaap synth!
 */
export const BUILT_IN_VICTORY_SONG: VictorySongData = {
  title: 'Moksha Geet — Aakhiri Shanti',
  subtitle: 'Original Raga Bhairavi → Raga Yaman Spirit Farewell',
  lyrics: [
    {
      timeSec: 0,
      hindi: 'सदियों की तन्हाई टूटी, पायल की ज़ंजीर खुली...',
      hinglish: 'Sadiyon ki tanhaai tooti, payal ki zanjeer khuli...',
    },
    {
      timeSec: 6.5,
      hindi: 'हवन की इस पावन अग्नि में, मेरी हर पीड़ा जल चली...',
      hinglish: 'Havan ki is paavan agni mein, meri har peeda jal chali...',
    },
    {
      timeSec: 13.0,
      hindi: 'अंधेरी हवेली अब रोशन हुई, सुनहरा सवेरा आ गया...',
      hinglish: 'Andheri haveli ab roshan hui, sunehra savera aa gaya...',
    },
    {
      timeSec: 19.5,
      hindi: 'धन्यवाद मेरे मुक्तिदाता... अब मेरी आत्मा को मोक्ष मिल गया...',
      hinglish: 'Dhanyavaad mere muktidata... ab meri aatma ko Moksha mil gaya...',
    },
  ],
};
