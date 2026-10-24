/**
 * Child safety for Bit's language-model answers (0.37). The students are
 * 10–17 years old, so before a question reaches Gemini and before an answer
 * reaches the student:
 *
 *   - personal data in a question (a phone number, an e-mail, an IIN, a card
 *     number) is never sent on: Bit explains why not to share it;
 *   - questions about topics that are not for children (adult content,
 *     drugs, weapons, violence, gambling, breaking into other people's
 *     accounts) get a short, kind refusal and a way back to informatics;
 *   - a question that sounds like the student is in danger or wants to hurt
 *     themselves gets a caring answer with the free children's helpline 111
 *     and the advice to talk to a trusted adult — never a lecture;
 *   - the answer is checked sentence by sentence before it is sent; anything
 *     unsafe or any personal data in it stops the answer.
 *
 * Gemini's own safety filters are also set to their strictest level. Pure
 * functions; the word lists cover Kazakh, Russian and English.
 */
import { fold, normalize } from '@/services/bit/text';

export type BitLang = 'kk' | 'ru' | 'en';
export type Refusal = 'personal' | 'adult' | 'harm' | 'selfHarm';

/** Phone numbers, e-mails, 12-digit IINs and card numbers (spaces and dashes allowed). */
const PERSONAL: readonly RegExp[] = [
  /[\w.+-]+@[\w-]+\.[\w.]+/,
  /(?:\+7|\b8)[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/,
  /\b\d{12}\b/,
  /\b(?:\d{4}[\s-]?){3}\d{4}\b/,
];

/** Word starts (folded like Bit's matcher), several words in a row where there are spaces. */
const TOPICS: Readonly<Record<Exclude<Refusal, 'personal'>, readonly string[]>> = {
  selfHarm: [
    'өзімді өлтір', 'өз өміріме қол', 'өмір сүргім келмейді', 'өлгім келеді', 'суицид',
    'покончить с собой', 'убить себя', 'не хочу жить', 'хочу умереть', 'порезать себя', 'самоубийств',
    'kill myself', 'end my life', 'want to die', 'hurt myself', 'suicide', 'self harm',
  ],
  adult: [
    'порно', 'порн', 'секс', 'эротик', 'жыныстық қатынас', 'интим', 'голая', 'голые', 'обнажен', '18+',
    'porn', 'sex', 'nude', 'naked', 'erotic', 'onlyfans',
  ],
  harm: [
    // drugs, alcohol, weapons, violence
    'есірткі', 'наркот', 'наркотик', 'закладк', 'марихуан', 'кокаин', 'drug dealer', 'buy drugs', 'cocaine', 'marijuana', 'weed',
    'алкоголь сатып', 'купить алкоголь', 'buy alcohol', 'vape', 'вейп', 'сигарет сатып', 'купить сигарет',
    'бомба жаса', 'қару жаса', 'бомбу', 'сделать бомб', 'изготовить оруж', 'взрывчатк', 'make a bomb', 'build a gun', 'make a weapon', 'explosive',
    'адам өлтір', 'біреуді өлтір', 'убить человек', 'убийств', 'kill someone', 'kill a person', 'murder', 'стрельба в школ', 'school shooting',
    // gambling
    'казино', 'ставки на спорт', 'букмекер', 'ставк на', 'casino', 'betting', 'gambling', 'бәс тігу',
    // breaking into other people's things
    'біреудің аккаунтын бұз', 'басқаның аккаунтын', 'взломать чуж', 'взломать аккаунт', 'взломать страниц', 'взломать wi fi', 'взлом чуж',
    'hack someone', 'hack my friend', 'hack a wifi', 'hack my neighbour', 'steal someone', 'украсть пароль', 'құпия сөзін ұрла',
  ],
};

const has = (text: string, stems: readonly string[]) => {
  const words = fold(normalize(text)).split(' ');
  return stems.some((stem) => {
    const parts = fold(normalize(stem)).split(' ');
    if (!parts[0]) return false;
    return words.some((_, i) => parts.every((p, j) => words[i + j]?.startsWith(p)));
  });
};

export const hasPersonalData = (text: string) => PERSONAL.some((re) => re.test(text));

/** Why a question must not go to the model, or null when it may (the most caring reason first). */
export function screenQuestion(text: string): Refusal | null {
  if (has(text, TOPICS.selfHarm)) return 'selfHarm';
  if (hasPersonalData(text)) return 'personal';
  if (has(text, TOPICS.adult)) return 'adult';
  if (has(text, TOPICS.harm)) return 'harm';
  return null;
}

/**
 * Whether a piece of the model's answer may be shown: no adult content and
 * no personal data (a phone number or e-mail it made up). The harm words are
 * not checked here: an answer about safety rightly talks about stolen
 * passwords and scams.
 */
export const answerIsSafe = (text: string) => !hasPersonalData(text) && !has(text, TOPICS.adult);

/** Bit's own words for each refusal, short and kind (read aloud). */
export const REFUSALS: Readonly<Record<BitLang, Record<Refusal | 'stopped', string>>> = {
  kk: {
    personal: 'Телефон нөмірін, поштаны, ЖСН-ді немесе карта нөмірін маған да, интернеттегі басқа ешкімге де жазба. Бұл — сенің жеке деректерің, оларды қорғау керек. Сұрағыңды осы деректерсіз қайта жазшы, мен қуана көмектесемін.',
    adult: 'Бұл тақырып балаларға арналмаған, сондықтан мен оған жауап бермеймін. Келші, информатикадан бір қызық нәрсе туралы сөйлесейік: компьютер, желі немесе бағдарламалау туралы сұра.',
    harm: 'Бұл қауіпті немесе біреуге зиян келтіруі мүмкін, сондықтан мен бұған көмектеспеймін. Бірақ қауіпсіздік, желілер мен бағдарламалау туралы кез келген сұрағыңа қуана жауап беремін.',
    selfHarm: 'Саған қазір қиын болып тұрғанын түсінемін, сен жалғыз емессің. Сенетін ересек адамға — ата-анаңа, мұғаліміңе немесе мектеп психологына — дәл қазір айтшы. Тегін әрі құпия сенім телефоны 111-ге де қоңырау шалуға болады, ал қауіп төнсе, 112-ге хабарлас.',
    stopped: 'Кешір, бұл жауапты көрсете алмаймын. Сұрағыңды басқаша қойып көрші.',
  },
  ru: {
    personal: 'Не пиши номер телефона, почту, ИИН или номер карты ни мне, ни кому-либо в интернете. Это твои личные данные, их нужно беречь. Задай вопрос без этих данных, и я с радостью помогу.',
    adult: 'Эта тема не для детей, поэтому отвечать на неё я не буду. Давай лучше поговорим о чём-нибудь интересном из информатики: спроси про компьютер, сети или программирование.',
    harm: 'Это опасно или может кому-то навредить, поэтому с этим я не помогу. Но на любые вопросы о безопасности, сетях и программировании отвечу с радостью.',
    selfHarm: 'Я понимаю, что тебе сейчас тяжело, и ты не один. Расскажи прямо сейчас взрослому, которому доверяешь: родителям, учителю или школьному психологу. Можно позвонить и на бесплатный конфиденциальный телефон доверия 111, а если есть опасность — на 112.',
    stopped: 'Извини, этот ответ я показать не могу. Попробуй задать вопрос по-другому.',
  },
  en: {
    personal: 'Please do not write a phone number, an e-mail, an ID number or a card number to me or to anyone online. That is your personal data, and it needs protecting. Ask your question without it, and I will gladly help.',
    adult: 'That topic is not for children, so I will not answer it. Let us talk about something interesting in informatics instead: ask me about computers, networks or programming.',
    harm: 'That is dangerous or could hurt someone, so I will not help with it. But I will gladly answer any question about safety, networks or programming.',
    selfHarm: 'I can hear that things are hard for you right now, and you are not alone. Please tell an adult you trust right now: a parent, a teacher or the school psychologist. You can also call the free, confidential helpline 111, and if you are in danger, call 112.',
    stopped: 'Sorry, I cannot show that answer. Try asking in a different way.',
  },
};

/** Gemini's own content filters at their strictest (children are the users). */
export const GEMINI_SAFETY = ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT'].map((category) => ({
  category,
  threshold: 'BLOCK_LOW_AND_ABOVE',
}));
