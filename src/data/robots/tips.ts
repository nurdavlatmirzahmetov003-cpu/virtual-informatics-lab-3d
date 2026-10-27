/**
 * V4 §4.5: the robots' tips — short, child-friendly advice in each robot's
 * topic (roster.ts): computer and internet safety (the cyber-guard), room
 * and electrical safety (the inspector, the cleaner), posture and eye
 * breaks (the coach), etiquette and good manners (the guide, the teacher,
 * the presenter) and fun facts (the librarian, the cargo robot, the
 * assembler). Spoken by Bit's voice with subtitles; each tip heard once
 * earns coins (services/robots/economy.ts). Facts are kept to what is
 * well documented.
 */
import type { RobotId } from './roster';

export interface Tip {
  id: string;
  robot: RobotId;
  kk: string;
  ru: string;
  en: string;
}

export const TIPS: readonly Tip[] = [
  /* ── the cyber-guard: computer and internet safety ── */
  {
    id: 'guard.long_password',
    robot: 'guard',
    kk: 'Мықты құпиясөз ұзын болады: әріптер, сандар мен белгілер аралас. Есте сақтау үшін бірнеше сөзден тұратын сөйлем ойлап табыңыз.',
    ru: 'Надёжный пароль — длинный: буквы, цифры и знаки вперемешку. Чтобы запомнить, придумайте фразу из нескольких слов.',
    en: 'A strong password is long, with letters, numbers and symbols mixed. To remember it, make up a phrase of several words.',
  },
  {
    id: 'guard.secret_password',
    robot: 'guard',
    kk: 'Құпиясөзіңізді ешкімге айтпаңыз, тіпті ең жақын досыңызға да. Оны тек ата-анаңыз білсе болады.',
    ru: 'Никому не говорите свой пароль, даже лучшему другу. Знать его могут только родители.',
    en: 'Never tell anyone your password, not even your best friend. Only your parents may know it.',
  },
  {
    id: 'guard.different_passwords',
    robot: 'guard',
    kk: 'Әр сайтқа бөлек құпиясөз қойыңыз. Біреуі ұрланса да, қалғандары қауіпсіз қалады.',
    ru: 'Для каждого сайта — свой пароль. Если один украдут, остальные останутся в безопасности.',
    en: 'Use a different password for each site. If one is stolen, the others stay safe.',
  },
  {
    id: 'guard.prize_link',
    robot: 'guard',
    kk: '«Сіз сыйлық ұтып алдыңыз!» деген бейтаныс хаттағы сілтемені баспаңыз. Бұл — алаяқтардың жиі қолданатын айласы.',
    ru: 'Не нажимайте на ссылку в незнакомом письме «Вы выиграли приз!». Это частая уловка мошенников.',
    en: 'Do not click the link in a strange message saying "You won a prize!". It is a common trick of scammers.',
  },
  {
    id: 'guard.check_sender',
    robot: 'guard',
    kk: 'Хат кімнен келгенін тексеріңіз. Күмәндансаңыз, ештеңе баспай, үлкендерден сұраңыз.',
    ru: 'Проверьте, от кого пришло письмо. Если сомневаетесь, ничего не нажимайте и спросите взрослых.',
    en: 'Check who a message is from. If you are not sure, click nothing and ask an adult.',
  },
  {
    id: 'guard.personal_data',
    robot: 'guard',
    kk: 'Интернетте бейтаныс адамдарға үй мекенжайыңызды, телефон нөміріңізді және мектебіңізді айтпаңыз.',
    ru: 'Не сообщайте незнакомым людям в интернете свой домашний адрес, номер телефона и школу.',
    en: 'Do not tell strangers online your home address, your phone number or your school.',
  },
  {
    id: 'guard.photos',
    robot: 'guard',
    kk: 'Суретті интернетке салмас бұрын ойланыңыз: бір рет жарияланған суретті толық өшіру қиын.',
    ru: 'Прежде чем выложить фото в интернет, подумайте: опубликованное фото трудно удалить полностью.',
    en: 'Think before you post a photo online: once it is out there, it is hard to remove completely.',
  },
  {
    id: 'guard.lock_screen',
    robot: 'guard',
    kk: 'Компьютерден кетерде экранды құлыптаңыз: Windows-та Win мен L пернелерін бірге басу жеткілікті.',
    ru: 'Уходя от компьютера, заблокируйте экран: в Windows достаточно нажать Win и L вместе.',
    en: 'Lock the screen when you leave the computer: on Windows, just press Win and L together.',
  },
  {
    id: 'guard.updates',
    robot: 'guard',
    kk: 'Жаңартуларды кейінге қалдырмаңыз: олар қауіпсіздіктегі осал тұстарды жабады.',
    ru: 'Не откладывайте обновления: они закрывают дыры в безопасности.',
    en: 'Do not put off updates: they close security holes.',
  },

  /* ── the inspector: room and electrical safety ── */
  {
    id: 'inspector.wet_hands',
    robot: 'inspector',
    kk: 'Ашаға да, розеткаға да ешқашан су қолмен тиіспеңіз. Су электр тогын өткізеді.',
    ru: 'Никогда не трогайте вилку или розетку мокрыми руками. Вода проводит электрический ток.',
    en: 'Never touch a plug or a socket with wet hands. Water conducts electricity.',
  },
  {
    id: 'inspector.tidy_cables',
    robot: 'inspector',
    kk: 'Кабельдерді жинақы ұстаңыз: еденде шашылып жатқан сымға біреу сүрініп құлауы мүмкін.',
    ru: 'Держите кабели в порядке: о провод, брошенный на полу, легко споткнуться.',
    en: 'Keep cables tidy: someone can trip over a wire lying across the floor.',
  },
  {
    id: 'inspector.overload',
    robot: 'inspector',
    kk: 'Бір ұзартқышқа тым көп құрылғы қоспаңыз — ол қызып кетуі мүмкін.',
    ru: 'Не включайте слишком много устройств в один удлинитель — он может перегреться.',
    en: 'Do not plug too many devices into one extension lead — it can overheat.',
  },
  {
    id: 'inspector.pull_plug',
    robot: 'inspector',
    kk: 'Ашаны розеткадан сымынан тартпай, өзінен ұстап суырыңыз.',
    ru: 'Вынимайте вилку из розетки, держась за саму вилку, а не за провод.',
    en: 'Pull a plug out of the socket by the plug itself, not by the cable.',
  },
  {
    id: 'inspector.drinks',
    robot: 'inspector',
    kk: 'Шәй мен шырынды компьютерден және розеткалардан алыс қойыңыз. Төгілген сусын құрылғыны бүлдіреді.',
    ru: 'Ставьте чай и сок подальше от компьютера и розеток. Пролитый напиток портит технику.',
    en: 'Keep tea and juice away from the computer and the sockets. A spilt drink can ruin a device.',
  },
  {
    id: 'inspector.vents',
    robot: 'inspector',
    kk: 'Компьютердің желдету тесіктерін жаппаңыз: салқындау үшін оған ауа керек.',
    ru: 'Не закрывайте вентиляционные отверстия компьютера: ему нужен воздух, чтобы остывать.',
    en: 'Do not cover the computer\'s vents: it needs air to stay cool.',
  },
  {
    id: 'inspector.burning_smell',
    robot: 'inspector',
    kk: 'Күйік иісі шықса немесе түтін көрінсе, құрылғыдан алыстап, бірден үлкендерге айтыңыз. Электр құралын сумен сөндіруге болмайды.',
    ru: 'Если запахло гарью или пошёл дым, отойдите от устройства и сразу скажите взрослым. Электроприборы нельзя тушить водой.',
    en: 'If you smell burning or see smoke, move away from the device and tell an adult at once. Never put water on electrical things.',
  },
  {
    id: 'inspector.broken_cable',
    robot: 'inspector',
    kk: 'Сымы жарылған немесе зақымданған зарядтағышты қолданбаңыз — үлкендерге көрсетіңіз.',
    ru: 'Не пользуйтесь зарядкой с треснувшим или повреждённым проводом — покажите её взрослым.',
    en: 'Do not use a charger with a cracked or damaged cable — show it to an adult.',
  },

  /* ── the cleaner: a tidy, healthy workplace ── */
  {
    id: 'cleaner.wash_hands',
    robot: 'cleaner',
    kk: 'Ортақ пернетақтаға отырмас бұрын қолыңызды жуыңыз. Таза қол — таза пернетақта.',
    ru: 'Прежде чем сесть за общую клавиатуру, вымойте руки. Чистые руки — чистая клавиатура.',
    en: 'Wash your hands before using a shared keyboard. Clean hands, clean keyboard.',
  },
  {
    id: 'cleaner.food',
    robot: 'cleaner',
    kk: 'Компьютердің жанында тамақ жемеңіз: үгіндісі пернелердің арасына түсіп қалады.',
    ru: 'Не ешьте у компьютера: крошки забиваются между клавишами.',
    en: 'Do not eat at the computer: crumbs get stuck between the keys.',
  },
  {
    id: 'cleaner.screen',
    robot: 'cleaner',
    kk: 'Экранды құрғақ жұмсақ шүберекпен сүртіңіз. Экранға сұйықтық тікелей шашуға болмайды.',
    ru: 'Протирайте экран сухой мягкой тканью. Брызгать жидкостью прямо на экран нельзя.',
    en: 'Wipe the screen with a dry, soft cloth. Never spray liquid straight onto the screen.',
  },
  {
    id: 'cleaner.germs',
    robot: 'cleaner',
    kk: 'Пернетақта мен тінтуірге микробтар көп жиналады. Оларды жиі тазалап тұрыңыз.',
    ru: 'На клавиатуре и мышке собирается много микробов. Чистите их почаще.',
    en: 'Keyboards and mice collect lots of germs. Clean them often.',
  },
  {
    id: 'cleaner.recycling',
    robot: 'cleaner',
    kk: 'Қоқысты себетке тастаңыз. Ал ескі батареялар мен құрылғыларды арнайы қабылдау орындарына тапсырыңыз.',
    ru: 'Мусор бросайте в корзину, а старые батарейки и устройства сдавайте в специальные пункты приёма.',
    en: 'Put rubbish in the bin, and take old batteries and devices to a special recycling point.',
  },
  {
    id: 'cleaner.put_back',
    robot: 'cleaner',
    kk: 'Жұмысты бітірген соң құлаққап пен тінтуірді орнына қойыңыз. Келесі адамға ыңғайлы болады.',
    ru: 'Закончив работу, положите наушники и мышку на место. Следующему будет удобно.',
    en: 'When you finish, put the headphones and the mouse back in their place. It helps the next person.',
  },

  /* ── the coach: posture and eye breaks ── */
  {
    id: 'coach.20_20_20',
    robot: 'coach',
    kk: 'Әр 20 минут сайын 20 секунд бойы алты метрдей қашықтықтағы бір нәрсеге қараңыз. Көзіңіз демалады.',
    ru: 'Каждые 20 минут смотрите 20 секунд на что-нибудь метрах в шести от вас. Глаза отдохнут.',
    en: 'Every 20 minutes, look at something about six metres away for 20 seconds. Your eyes get a rest.',
  },
  {
    id: 'coach.sit_back',
    robot: 'coach',
    kk: 'Арқаңызды орындықтың арқалығына сүйеп, табаныңызды еденге толық қойып отырыңыз.',
    ru: 'Сидите, опираясь спиной на спинку стула, а ступни ставьте на пол целиком.',
    en: 'Sit with your back against the chair and your feet flat on the floor.',
  },
  {
    id: 'coach.screen_height',
    robot: 'coach',
    kk: 'Экранның жоғарғы шеті көз деңгейінде немесе одан сәл төмен тұрсын. Сонда мойын шаршамайды.',
    ru: 'Верхний край экрана должен быть на уровне глаз или чуть ниже. Тогда шея не устаёт.',
    en: 'The top of the screen should be at eye level or a little below. Then your neck does not get tired.',
  },
  {
    id: 'coach.distance',
    robot: 'coach',
    kk: 'Экранға тым жақын отырмаңыз: аралық шамамен созылған қолдың ұзындығындай болсын.',
    ru: 'Не садитесь слишком близко к экрану: расстояние — примерно длина вытянутой руки.',
    en: 'Do not sit too close to the screen: keep it about an arm\'s length away.',
  },
  {
    id: 'coach.blink',
    robot: 'coach',
    kk: 'Экранға қарап отырғанда көзді жиі жыпылықтатуды ұмытпаңыз. Құрғаған көз тез шаршайды.',
    ru: 'Глядя на экран, не забывайте моргать. Сухие глаза быстро устают.',
    en: 'Remember to blink while you look at a screen. Dry eyes get tired quickly.',
  },
  {
    id: 'coach.stretch',
    robot: 'coach',
    kk: 'Сағат сайын орныңыздан тұрып, бірнеше минут керіліп, жүріп қайтыңыз. Бұл — бапкердің бұйрығы!',
    ru: 'Каждый час вставайте, потягивайтесь и пройдитесь несколько минут. Это приказ тренера!',
    en: 'Every hour, stand up, stretch and walk around for a few minutes. Coach\'s orders!',
  },
  {
    id: 'coach.wrists',
    robot: 'coach',
    kk: 'Теріп отырғанда білегіңізді түзу ұстаңыз, иықтарыңызды босатыңыз.',
    ru: 'Когда печатаете, держите запястья прямо, а плечи расслабьте.',
    en: 'Keep your wrists straight and your shoulders relaxed while you type.',
  },
  {
    id: 'coach.light',
    robot: 'coach',
    kk: 'Экран бөлмеден жарық болмасын, ал терезе жарығы экранға шағылыспасын.',
    ru: 'Экран не должен быть ярче комнаты, а свет из окна не должен бликовать на экране.',
    en: 'The screen should not be brighter than the room, and window light should not glare on it.',
  },

  /* ── the teacher: manners in class and online ── */
  {
    id: 'teacher.raise_hand',
    robot: 'teacher',
    kk: 'Сабақта сөйлегіңіз келсе, алдымен қол көтеріңіз. Сонда бәрі бір-бірін естиді.',
    ru: 'Хотите сказать на уроке — сначала поднимите руку. Так все услышат друг друга.',
    en: 'If you want to speak in class, raise your hand first. That way everyone can hear each other.',
  },
  {
    id: 'teacher.kind_words',
    robot: 'teacher',
    kk: 'Интернетте де бетпе-бет сөйлескендей сыпайы жазыңыз. Экранның арғы жағында да адам отыр.',
    ru: 'В интернете пишите так же вежливо, как говорите лицом к лицу. По ту сторону экрана тоже человек.',
    en: 'Online, write as politely as you would speak face to face. There is a person on the other side of the screen too.',
  },
  {
    id: 'teacher.capitals',
    robot: 'teacher',
    kk: 'Хатты тек БАС ӘРІПТЕРМЕН жазбаңыз — интернетте бұл айқайлағандай көрінеді.',
    ru: 'Не пишите сообщения ТОЛЬКО ЗАГЛАВНЫМИ БУКВАМИ — в интернете это похоже на крик.',
    en: 'Do not write messages IN CAPITAL LETTERS ONLY — online it looks like shouting.',
  },
  {
    id: 'teacher.ask',
    robot: 'teacher',
    kk: 'Түсінбесеңіз, сұраңыз. Сұрақ қою — ұят емес, ақылдылықтың белгісі.',
    ru: 'Если непонятно — спрашивайте. Задавать вопросы не стыдно, это признак ума.',
    en: 'If you do not understand, ask. Asking questions is not shameful — it is smart.',
  },
  {
    id: 'teacher.credit',
    robot: 'teacher',
    kk: 'Біреудің суретін немесе мәтінін пайдалансаңыз, авторын көрсетіңіз. Бұл — оның еңбегіне құрмет.',
    ru: 'Если берёте чужую картинку или текст, укажите автора. Это уважение к его труду.',
    en: 'If you use someone else\'s picture or text, name the author. It respects their work.',
  },
  {
    id: 'teacher.mute',
    robot: 'teacher',
    kk: 'Онлайн сабақта сөйлемей отырғанда микрофонды өшіріп қойыңыз: шу басқаларға кедергі жасайды.',
    ru: 'На онлайн-уроке, когда не говорите, выключайте микрофон: шум мешает другим.',
    en: 'In an online lesson, mute your microphone when you are not speaking: noise disturbs the others.',
  },

  /* ── the guide: good manners with people ── */
  {
    id: 'guide.greet',
    robot: 'guide',
    kk: 'Кірген кезде амандасыңыз: «Сәлеметсіз бе!» Жылы сөз — жақсы күннің бастамасы.',
    ru: 'Входя, здоровайтесь: «Здравствуйте!» Доброе слово — начало хорошего дня.',
    en: 'Say hello when you come in. A kind word is the start of a good day.',
  },
  {
    id: 'guide.magic_words',
    robot: 'guide',
    kk: '«Рақмет», «Өтінемін» және «Кешіріңіз» — сиқырлы сөздер. Оларды жиі айтыңыз.',
    ru: '«Спасибо», «Пожалуйста» и «Извините» — волшебные слова. Говорите их почаще.',
    en: '"Thank you", "please" and "sorry" are magic words. Say them often.',
  },
  {
    id: 'guide.queue',
    robot: 'guide',
    kk: 'Ортақ компьютерге кезекпен отырыңыз. Кезек күту — басқаларға деген құрмет.',
    ru: 'За общий компьютер садитесь по очереди. Подождать — значит уважать других.',
    en: 'Take turns at a shared computer. Waiting your turn shows respect for others.',
  },
  {
    id: 'guide.tidy_desk',
    robot: 'guide',
    kk: 'Кетерде жұмыс орныңызды таза қалдырыңыз — келесі адам сізге алғыс айтады.',
    ru: 'Уходя, оставьте рабочее место чистым — следующий скажет вам спасибо.',
    en: 'Leave your workplace clean when you go — the next person will thank you.',
  },
  {
    id: 'guide.listen',
    robot: 'guide',
    kk: 'Біреу сөйлеп тұрғанда сөзін бөлмей, соңына дейін тыңдаңыз.',
    ru: 'Когда кто-то говорит, не перебивайте, дослушайте до конца.',
    en: 'When someone is talking, do not interrupt — listen to the end.',
  },
  {
    id: 'guide.help_friend',
    robot: 'guide',
    kk: 'Сыныптасыңыз бір тапсырмада қиналса, мейіріммен көмек ұсыныңыз. Бірге үйрену қызық!',
    ru: 'Если однокласснику трудно с заданием, по-доброму предложите помощь. Учиться вместе интересно!',
    en: 'If a classmate is stuck on a task, kindly offer to help. Learning together is fun!',
  },

  /* ── the presenter: speaking in front of others ── */
  {
    id: 'presenter.eye_contact',
    robot: 'presenter',
    kk: 'Таныстырылым кезінде экранға емес, тыңдаушыларға қараңыз.',
    ru: 'Во время выступления смотрите на слушателей, а не на экран.',
    en: 'When you present, look at your audience, not at the screen.',
  },
  {
    id: 'presenter.few_words',
    robot: 'presenter',
    kk: 'Слайдта сөз аз, сурет үлкен болсын. Қалғанын өзіңіз айтып бересіз.',
    ru: 'На слайде — мало слов и крупные картинки. Остальное вы расскажете сами.',
    en: 'Put few words and big pictures on a slide. You tell the rest yourself.',
  },
  {
    id: 'presenter.rehearse',
    robot: 'presenter',
    kk: 'Сөзіңізді алдын ала дауыстап бірнеше рет қайталап шығыңыз. Сонда толқымайсыз.',
    ru: 'Прорепетируйте выступление вслух несколько раз заранее. Тогда не будете волноваться.',
    en: 'Rehearse your talk out loud a few times beforehand. Then you will not be so nervous.',
  },
  {
    id: 'presenter.slowly',
    robot: 'presenter',
    kk: 'Асықпай, анық сөйлеңіз. Кідіріс жасау — қате емес, ол тыңдаушыға ойлануға уақыт береді.',
    ru: 'Говорите медленно и чётко. Пауза — не ошибка, она даёт слушателям время подумать.',
    en: 'Speak slowly and clearly. A pause is not a mistake — it gives listeners time to think.',
  },
  {
    id: 'presenter.thank_questions',
    robot: 'presenter',
    kk: 'Сұрақ қойғандарға алғыс айтыңыз. Жауабын білмесеңіз, «Анықтап айтамын» деуге болады.',
    ru: 'Благодарите за вопросы. Если не знаете ответа, можно сказать: «Я уточню и расскажу».',
    en: 'Thank people for their questions. If you do not know the answer, you can say "I will find out".',
  },
  {
    id: 'presenter.on_time',
    robot: 'presenter',
    kk: 'Берілген уақыттан аспаңыз: басқалар да сөйлеуі керек.',
    ru: 'Укладывайтесь в отведённое время: другим тоже нужно выступить.',
    en: 'Keep to your time: others need to speak too.',
  },

  /* ── the librarian: fun facts ── */
  {
    id: 'librarian.eniac',
    robot: 'librarian',
    kk: '1946 жылы жасалған алғашқы компьютерлердің бірі ENIAC шамамен 27 тонна тартқан және үлкен бөлмені алып тұрған.',
    ru: 'ENIAC, один из первых компьютеров, построенный в 1946 году, весил около 27 тонн и занимал целый зал.',
    en: 'ENIAC, one of the first computers, built in 1946, weighed about 27 tonnes and filled a large room.',
  },
  {
    id: 'librarian.first_bug',
    robot: 'librarian',
    kk: 'Бағдарламадағы қатені «баг» (ағылшынша — қоңыз) дейді. 1947 жылы компьютердің ішінен шынымен көбелек табылған!',
    ru: 'Ошибку в программе называют «баг» (по-английски — жук). В 1947 году внутри компьютера нашли настоящую моль!',
    en: 'A mistake in a program is called a "bug". In 1947 a real moth was found inside a computer!',
  },
  {
    id: 'librarian.byte',
    robot: 'librarian',
    kk: 'Бір байт сегіз биттен тұрады. Бір әріпті сақтауға әдетте бір немесе екі байт жетеді.',
    ru: 'Один байт состоит из восьми битов. Чтобы сохранить одну букву, обычно хватает одного или двух байтов.',
    en: 'One byte is eight bits. Storing one letter usually takes one or two bytes.',
  },
  {
    id: 'librarian.wooden_mouse',
    robot: 'librarian',
    kk: '1960 жылдары жасалған алғашқы компьютер тінтуірі ағаштан жасалған.',
    ru: 'Первая компьютерная мышь, созданная в 1960-х годах, была деревянной.',
    en: 'The first computer mouse, made in the 1960s, was made of wood.',
  },
  {
    id: 'librarian.sea_cables',
    robot: 'librarian',
    kk: 'Елдер мен құрлықтар арасындағы интернет деректерінің басым бөлігі спутник арқылы емес, теңіз түбіндегі кабельдер арқылы жүреді.',
    ru: 'Большая часть интернет-данных между странами и континентами идёт не через спутники, а по кабелям на дне моря.',
    en: 'Most internet data between countries and continents travels not through satellites but along cables on the sea floor.',
  },
  {
    id: 'librarian.qwerty',
    robot: 'librarian',
    kk: 'Пернетақтадағы QWERTY әріптер реті 1870 жылдары жазу машиналары үшін ойлап табылған.',
    ru: 'Порядок букв QWERTY на клавиатуре придумали в 1870-х годах для пишущих машинок.',
    en: 'The QWERTY order of letters on keyboards was invented in the 1870s for typewriters.',
  },
  {
    id: 'librarian.algorithm',
    robot: 'librarian',
    kk: '«Алгоритм» сөзі IX ғасырда өмір сүрген ұлы ғалым әл-Хорезмидің есімінен шыққан.',
    ru: 'Слово «алгоритм» произошло от имени великого учёного IX века аль-Хорезми.',
    en: 'The word "algorithm" comes from the name of al-Khwarizmi, a great scholar of the 9th century.',
  },
  {
    id: 'librarian.emoji',
    robot: 'librarian',
    kk: 'Алғашқы эмодзилерді 1999 жылы Жапонияда жасаған, олар бар болғаны 176 сурет еді.',
    ru: 'Первые эмодзи создали в Японии в 1999 году, их было всего 176.',
    en: 'The first emoji were made in Japan in 1999 — there were only 176 of them.',
  },

  /* ── the cargo robot: how data travels ── */
  {
    id: 'cargo.packets',
    robot: 'cargo',
    kk: 'Интернетте файл кішкене бөліктерге — пакеттерге бөлініп жіберіледі. Әр пакет әртүрлі жолмен жетуі мүмкін.',
    ru: 'В интернете файл отправляется маленькими частями — пакетами. Каждый пакет может прийти своим путём.',
    en: 'On the internet a file is sent in small pieces called packets. Each packet can take its own route.',
  },
  {
    id: 'cargo.fibre',
    robot: 'cargo',
    kk: 'Оптикалық талшықтағы жарық сигналы секундына шамамен 200 мың шақырым жүреді.',
    ru: 'Световой сигнал в оптоволокне проходит около 200 тысяч километров в секунду.',
    en: 'A light signal in an optical fibre travels about 200,000 kilometres a second.',
  },
  {
    id: 'cargo.apollo',
    robot: 'cargo',
    kk: 'Қазіргі смартфон адамдарды Айға жеткізген «Аполлон» кемесінің компьютерінен мыңдаған есе қуатты.',
    ru: 'Современный смартфон в тысячи раз мощнее компьютера корабля «Аполлон», доставившего людей на Луну.',
    en: 'A modern smartphone is thousands of times more powerful than the Apollo computer that took people to the Moon.',
  },
  {
    id: 'cargo.first_disk',
    robot: 'cargo',
    kk: '1956 жылғы алғашқы қатты диск 4 мегабайттан аз ақпарат сыйғызған, ал салмағы шамамен бір тонна болған.',
    ru: 'Первый жёсткий диск 1956 года вмещал меньше 4 мегабайт, а весил около тонны.',
    en: 'The first hard disk, from 1956, held less than 4 megabytes and weighed about a tonne.',
  },
  {
    id: 'cargo.usb',
    robot: 'cargo',
    kk: 'USB қосқышы 1996 жылы пайда болды. Содан бері ол құрылғыларды жалғаудың ең кең тараған тәсілі.',
    ru: 'Разъём USB появился в 1996 году. С тех пор это самый распространённый способ подключать устройства.',
    en: 'The USB connector appeared in 1996. Since then it has been the most common way to connect devices.',
  },
  {
    id: 'cargo.wifi',
    robot: 'cargo',
    kk: 'Wi-Fi деректерді радио сияқты радиотолқындармен тасиды, тек жиілігі жоғары: 2,4 немесе 5 гигагерц.',
    ru: 'Wi-Fi передаёт данные радиоволнами, как радио, только на более высокой частоте: 2,4 или 5 гигагерц.',
    en: 'Wi-Fi carries data on radio waves, like a radio, only at a higher frequency: 2.4 or 5 gigahertz.',
  },

  /* ── the assembler: inside the computer ── */
  {
    id: 'assembler.power_off',
    robot: 'assembler',
    kk: 'Компьютерді ашпас бұрын оны міндетті түрде өшіріп, ашасын розеткадан суырыңыз.',
    ru: 'Прежде чем открыть компьютер, обязательно выключите его и выньте вилку из розетки.',
    en: 'Before opening a computer, always switch it off and unplug it.',
  },
  {
    id: 'assembler.static',
    robot: 'assembler',
    kk: 'Бөлшектерге тиер алдында корпустың металына қолыңызды тигізіңіз: статикалық заряд кетеді.',
    ru: 'Прежде чем трогать детали, коснитесь металла корпуса: статический заряд уйдёт.',
    en: 'Before touching parts, touch the metal of the case: it lets static charge go.',
  },
  {
    id: 'assembler.cooler',
    robot: 'assembler',
    kk: 'Процессорға салқындатқыш пен термопаста керек. Онсыз ол бірнеше секундта қызып кетеді.',
    ru: 'Процессору нужны кулер и термопаста. Без них он перегреется за несколько секунд.',
    en: 'A processor needs a cooler and thermal paste. Without them it overheats in seconds.',
  },
  {
    id: 'assembler.ram_click',
    robot: 'assembler',
    kk: 'Жедел жад модулі ұяшыққа дұрыс кірсе, «шырт» етіп бекиді.',
    ru: 'Модуль оперативной памяти, вставленный правильно, защёлкивается в слоте со щелчком.',
    en: 'A memory module clicks into its slot when it goes in the right way.',
  },
  {
    id: 'assembler.transistors',
    robot: 'assembler',
    kk: 'Қазіргі процессордың ішінде миллиардтаған транзистор бар. Олардың әрқайсысы — кішкентай ауыстырып-қосқыш.',
    ru: 'Внутри современного процессора — миллиарды транзисторов. Каждый из них — крошечный переключатель.',
    en: 'A modern processor has billions of transistors inside. Each one is a tiny switch.',
  },
  {
    id: 'assembler.dust',
    robot: 'assembler',
    kk: 'Желдеткіштердегі шаңды тазалап тұрыңыз: шаң компьютерді ыстық әрі шулы етеді.',
    ru: 'Очищайте вентиляторы от пыли: из-за пыли компьютер греется и шумит.',
    en: 'Clean the dust out of the fans: dust makes a computer hot and noisy.',
  },
];

export const TIP_IDS: ReadonlySet<string> = new Set(TIPS.map((t) => t.id));
export const tipsOf = (robot: RobotId) => TIPS.filter((t) => t.robot === robot);
