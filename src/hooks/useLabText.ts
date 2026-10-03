import { useSettingsStore } from '@/store/settingsStore';

const kk = {
  assemblyTitle:'ДК құрастыру зертханасы', assemblyIntro:'Бөлшекті таңда. Қажетті жерге сүйреп апар немесе «Орнату» батырмасын бас. Үйлесімділікті тексеріп, компьютерді іске қос.',
  choose:'Бөлшектер', install:'Орнату', installed:'Орнатылды', cables:'Қуат кабельдері', boot:'Компьютерді іске қосу', reset:'Қайта бастау', hint:'Көмек',
  dragHint:'3D бөлшекті жарықталған ұяшыққа сүйре. Пернетақтамен: тізімнен таңдау → Орнату.', selectHint:'Үстелдегі немесе тізімдегі бөлшекті таңда.',
  prerequisite:'Алдымен орнат:', wrongSlot:'Бөлшек ұяшыққа жетпеді. Жарықталған нүктеге жақындат.', installedFeedback:'Бөлшек орнына бекітілді.', incomplete:'Алдымен барлық бөлшек пен қуат кабельдерін орнат.',
  compatibility:'Үйлесімділік', products:'Тәжірибе жинағы', modelNote:'Геометрия — өкілдік модель. Socket, RAM және қуат үйлесімділігі каталог сипаттамасымен тексеріледі.',
  progress:'Орындалуы', result:'Тапсырма нәтижесі', score:'Ұпай', time:'Уақыт', errors:'Қателер', hints:'Көмек саны', saved:'Нәтиже осы браузерде сақталды.',
  resultsTitle:'Менің нәтижелерім', resultsIntro:'Ең жақсы ұпайлар, соңғы әрекеттер және жетістіктер. Мәлімет осы құрылғыда сақталады.',
  points:'Жалпы ұпай', average:'Орташа нәтиже', completed:'Аяқталған тапсырмалар', recent:'Соңғы әрекеттер', achievements:'Жетістіктер', noResults:'Алғашқы тапсырманы орында — нәтиже осында пайда болады.',
  first:'Алғашқы қадам', five:'Бес тапсырма', engineer:'ДК инженері', pass:'Орындалды', practice:'Тағы жаттық', backLabs:'Зертханаларға',
  motherboardHint:'Платаны корпус тіректеріне бекіт. CPU мен RAM оның үстіне орнатылады.', cpuHint:'CPU socket түрі платаға сәйкес келуі керек. Оны күштеп баспа.',
  ramHint:'Екі RAM модулін A2/B2 ұяшықтарына орнат. DDR4 және DDR5 бір-бірін алмастырмайды.', ssdHint:'NVMe M.2 ұяшыққа орнатылады, SATA кабелі қажет емес.',
  coolerHint:'Алдымен CPU және RAM. Термопаста жұқа қабатпен жағылады; кулер жылуды шығарады.', psuHint:'Қуат блогын төменгі бөлікке бекіт. GPU және CPU үшін қуаты жеткілікті болуы керек.',
  gpuHint:'GPU PCIe x16 слотына орнатылады. Алдымен плата мен қуат блогын бекіт.', fansHint:'Желдеткіштер ауаны алдыңғы жақтан кіргізіп, арттан шығарады.', cablesHint:'24-pin платаға, EPS CPU-ға, PCIe GPU-ға жалғанады. Қуат өшірілгенде қос.',
} as const;
type LabKey = keyof typeof kk;
const ru: Record<LabKey,string> = {
  assemblyTitle:'Лаборатория сборки ПК', assemblyIntro:'Выбери компонент. Перетащи в подсвеченное место или нажми «Установить». Проверь совместимость и включи компьютер.',
  choose:'Компоненты', install:'Установить', installed:'Установлено', cables:'Кабели питания', boot:'Включить компьютер', reset:'Начать заново', hint:'Подсказка',
  dragHint:'Перетащи 3D-компонент к подсвеченному слоту. Клавиатура: выбери в списке → Установить.', selectHint:'Выбери компонент на столе или в списке.',
  prerequisite:'Сначала установи:', wrongSlot:'Компонент не достиг слота. Подвинь его к подсвеченной точке.', installedFeedback:'Компонент закреплён.', incomplete:'Сначала установи все компоненты и кабели питания.',
  compatibility:'Совместимость', products:'Учебная сборка', modelNote:'Геометрия условно представляет модель. Socket, RAM и мощность проверяются по характеристикам каталога.',
  progress:'Готовность', result:'Результат задания', score:'Баллы', time:'Время', errors:'Ошибки', hints:'Подсказки', saved:'Результат сохранён в этом браузере.',
  resultsTitle:'Мои результаты', resultsIntro:'Лучшие баллы, последние действия и достижения. Данные хранятся на этом устройстве.',
  points:'Всего баллов', average:'Средний результат', completed:'Выполнено заданий', recent:'Последние действия', achievements:'Достижения', noResults:'Выполни первое задание — результат появится здесь.',
  first:'Первый шаг', five:'Пять заданий', engineer:'Инженер ПК', pass:'Выполнено', practice:'Продолжай практику', backLabs:'В лаборатории',
  motherboardHint:'Закрепи плату на стойках корпуса. CPU и RAM устанавливаются на неё.', cpuHint:'Socket CPU должен соответствовать плате. Не применяй силу.',
  ramHint:'Два модуля RAM устанавливают в A2/B2. DDR4 и DDR5 не взаимозаменяемы.', ssdHint:'NVMe устанавливается в M.2, кабель SATA не нужен.',
  coolerHint:'Сначала CPU и RAM. Тонкий слой термопасты и кулер отводят тепло.', psuHint:'Закрепи блок питания снизу. Мощности должно хватать для CPU и GPU.',
  gpuHint:'GPU устанавливается в PCIe x16. Сначала закрепи плату и блок питания.', fansHint:'Вентиляторы забирают воздух спереди и выводят сзади.', cablesHint:'24-pin к плате, EPS к CPU, PCIe к GPU. Подключай при выключенном питании.',
};
const en: Record<LabKey,string> = {
  assemblyTitle:'PC assembly laboratory', assemblyIntro:'Select a component. Drag it to its highlighted slot or press Install. Check compatibility and power on the computer.',
  choose:'Components', install:'Install', installed:'Installed', cables:'Power cables', boot:'Power on', reset:'Start again', hint:'Hint',
  dragHint:'Drag the 3D component to the highlighted slot. Keyboard: select from the list → Install.', selectHint:'Select a component on the desk or in the list.',
  prerequisite:'Install first:', wrongSlot:'The component missed its slot. Move it closer to the highlighted point.', installedFeedback:'Component snapped into place.', incomplete:'Install all components and power cables first.',
  compatibility:'Compatibility', products:'Practice build', modelNote:'Geometry represents the component category. Socket, RAM and power compatibility use catalog specifications.',
  progress:'Completion', result:'Exercise result', score:'Score', time:'Time', errors:'Errors', hints:'Hints used', saved:'Result saved in this browser.',
  resultsTitle:'My results', resultsIntro:'Best scores, recent activity and achievements. Data is stored on this device.',
  points:'Total points', average:'Average score', completed:'Completed exercises', recent:'Recent activity', achievements:'Achievements', noResults:'Complete your first exercise to see results here.',
  first:'First step', five:'Five exercises', engineer:'PC engineer', pass:'Completed', practice:'Keep practicing', backLabs:'Laboratories',
  motherboardHint:'Fasten the motherboard to the case standoffs. CPU and RAM fit onto it.', cpuHint:'CPU socket must match the motherboard. Never force it.',
  ramHint:'Place two RAM modules in A2/B2. DDR4 and DDR5 are not interchangeable.', ssdHint:'NVMe fits into M.2 and needs no SATA cable.',
  coolerHint:'Install CPU and RAM first. A thin layer of thermal paste helps the cooler remove heat.', psuHint:'Fasten the PSU at the bottom. It must supply enough power for CPU and GPU.',
  gpuHint:'GPU fits into PCIe x16. Install the motherboard and PSU first.', fansHint:'Fans draw air in at the front and exhaust it at the back.', cablesHint:'24-pin to motherboard, EPS to CPU, PCIe to GPU. Connect with power off.',
};
export function useLabText() {
  const lang = useSettingsStore(s => s.language);
  const dict = {kk,ru,en}[lang];
  return (key: LabKey) => dict[key];
}
