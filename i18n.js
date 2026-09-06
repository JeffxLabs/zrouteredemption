(function (global) {
  "use strict";

  const LANGUAGES = [
    {code: "en", locale: "en-US", label: "English"},
    {code: "fr", locale: "fr-FR", label: "Français"},
    {code: "ru", locale: "ru-RU", label: "Русский"},
    {code: "tr", locale: "tr-TR", label: "Türkçe"},
    {code: "pl", locale: "pl-PL", label: "Polski"},
    {code: "es", locale: "es-ES", label: "Español"},
    {code: "pt", locale: "pt-PT", label: "Português"},
    {code: "de", locale: "de-DE", label: "Deutsch"},
    {code: "ko", locale: "ko-KR", label: "한국어"},
    {code: "ja", locale: "ja-JP", label: "日本語"},
    {code: "zh", locale: "zh-CN", label: "简体中文"}
  ];
  const LANGUAGE_CODES = new Set(LANGUAGES.map(item => item.code));
  const STORAGE_KEYS = ["zroute-lang", "zroute-language", "zroute-locale", "language"];
  const ATTRIBUTE_NAMES = ["aria-label", "title", "placeholder", "alt", "content"];

  // Each row is: English, French, Russian, Turkish, Polish, Spanish,
  // Portuguese, German, Korean, Japanese, Simplified Chinese.
  const ROWS = [
    ["Language", "Langue", "Язык", "Dil", "Język", "Idioma", "Idioma", "Sprache", "언어", "言語", "语言"],
    ["Z Route Planner", "Planificateur Z Route", "Планировщик Z Route", "Z Route Planlayıcı", "Planer Z Route", "Planificador Z Route", "Planejador Z Route", "Z-Route-Planer", "Z Route 플래너", "Z Routeプランナー", "Z Route 规划器"],
    ["Z Route Progression Planner", "Planificateur de progression Z Route", "Планировщик прогрессии Z Route", "Z Route İlerleme Planlayıcısı", "Planer progresji Z Route", "Planificador de progresión de Z Route", "Planejador de progressão Z Route", "Z-Route-Fortschrittsplaner", "Z Route 진행 플래너", "Z Route進行プランナー", "Z Route 进度规划器"],
    ["Calculators", "Calculateurs", "Калькуляторы", "Hesaplayıcılar", "Kalkulatory", "Calculadoras", "Calculadoras", "Rechner", "계산기", "計算機", "计算器"],
    ["Planner inputs", "Entrées du planificateur", "Параметры планировщика", "Planlayıcı girdileri", "Dane wejściowe planera", "Entradas del planificador", "Dados de entrada do planeador", "Planereingaben", "플래너 입력", "プランナー入力", "规划器输入"],
    ["ROI calculator inputs", "Entrées du calculateur ROI", "Параметры калькулятора ROI", "ROI hesaplayıcı girdileri", "Dane wejściowe kalkulatora ROI", "Entradas de la calculadora ROI", "Dados de entrada da calculadora ROI", "Eingaben des ROI-Rechners", "ROI 계산기 입력", "ROI計算機入力", "ROI 计算器输入"],
    ["App navigation", "Navigation de l'application", "Навигация приложения", "Uygulama gezintisi", "Nawigacja aplikacji", "Navegación de la aplicación", "Navegação da aplicação", "App-Navigation", "앱 탐색", "アプリナビゲーション", "应用导航"],
    ["Interactive Z Route Base leveling and resource-producer return-on-investment calculators.", "Calculateurs interactifs Z Route de progression de Base et de retour sur investissement des producteurs de ressources.", "Интерактивные калькуляторы Z Route для прокачки базы и окупаемости производителей ресурсов.", "Etkileşimli Z Route Üs seviyeleme ve kaynak üreticisi yatırım getirisi hesaplayıcıları.", "Interaktywne kalkulatory Z Route do rozwijania Bazy i zwrotu z inwestycji producentów zasobów.", "Calculadoras interactivas de nivelación de Base y retorno de inversión de productores de recursos de Z Route.", "Calculadoras interativas de evolução da Base e retorno do investimento de produtores de recursos Z Route.", "Interaktive Z-Route-Rechner für Basislevel und den Return on Investment von Ressourcenproduzenten.", "기지 레벨업과 자원 생산 시설 투자 수익률을 계산하는 대화형 Z Route 계산기입니다.", "基地レベル上げと資源生産施設の投資回収を計算するインタラクティブなZ Route計算機です。", "交互式 Z Route 基地升级和资源生产设施投资回报计算器。"],
    ["Costs and production are static Android-client values. Times apply the selected additive Building Speed and free-finish threshold; results cannot predict server overrides or alliance-help timing. Configuration files stay on your device—the planner does not upload or store account state.", "Les coûts et la production sont des valeurs statiques du client Android. Les durées appliquent la vitesse de construction additive sélectionnée et le seuil de finition gratuite ; les résultats ne peuvent pas prévoir les remplacements du serveur ni le délai d'aide de l'alliance. Les fichiers de configuration restent sur votre appareil : le planificateur n'envoie ni ne stocke l'état du compte.", "Стоимость и производство — статические значения клиента Android. Время учитывает выбранную суммарную скорость строительства и порог бесплатного завершения; результаты не могут предсказать изменения сервера или время помощи альянса. Файлы конфигурации остаются на устройстве — планировщик не загружает и не хранит состояние аккаунта.", "Maliyetler ve üretim, Android istemcisindeki sabit değerlerdir. Süreler seçilen ek İnşaat Hızı ve ücretsiz bitirme eşiğini uygular; sonuçlar sunucu değişikliklerini veya ittifak yardımı zamanlamasını öngöremez. Yapılandırma dosyaları cihazınızda kalır; planlayıcı hesap durumunu yüklemez veya saklamaz.", "Koszty i produkcja to statyczne wartości klienta Android. Czasy uwzględniają wybraną dodatkową szybkość budowy i próg darmowego ukończenia; wyniki nie przewidują zmian serwera ani czasu pomocy sojuszu. Pliki konfiguracji pozostają na urządzeniu — planer nie wysyła ani nie przechowuje stanu konta.", "Los costes y la producción son valores estáticos del cliente Android. Los tiempos aplican la velocidad de construcción adicional y el umbral de finalización gratuita seleccionados; los resultados no pueden predecir cambios del servidor ni el tiempo de ayuda de la alianza. Los archivos de configuración permanecen en tu dispositivo: el planificador no sube ni almacena el estado de la cuenta.", "Os custos e a produção são valores estáticos do cliente Android. Os tempos aplicam a Velocidade de construção adicional e o limiar de conclusão grátis selecionados; os resultados não podem prever alterações do servidor nem o momento da ajuda da aliança. Os ficheiros de configuração ficam no seu dispositivo — o planeador não carrega nem armazena o estado da conta.", "Kosten und Produktion sind statische Werte des Android-Clients. Die Zeiten berücksichtigen die gewählte additive Baugeschwindigkeit und den Schwellenwert für kostenlose Abschlüsse; Ergebnisse können Serverüberschreibungen oder das Timing von Allianz-Hilfe nicht vorhersagen. Konfigurationsdateien bleiben auf deinem Gerät — der Planer lädt den Kontostand weder hoch noch speichert er ihn.", "비용과 생산량은 Android 클라이언트의 고정 값입니다. 시간은 선택한 추가 건설 속도와 무료 완료 임계값을 적용하며, 서버 변경이나 연맹 지원 시점은 예측할 수 없습니다. 구성 파일은 기기에 보관되며 플래너는 계정 상태를 업로드하거나 저장하지 않습니다.", "コストと生産量はAndroidクライアントの固定値です。時間には選択した加算建設速度と無料完了のしきい値が適用されますが、サーバー側の上書きや同盟ヘルプのタイミングは予測できません。設定ファイルは端末に保存され、プランナーがアカウント状態をアップロードまたは保存することはありません。", "成本和产量是 Android 客户端中的静态数值。时间会应用所选的额外建造速度和免费完成阈值；结果无法预测服务器覆盖或联盟帮助的时间。配置文件保存在你的设备上，规划器不会上传或存储账户状态。"],
    ["Base planner", "Planificateur de Base", "Планировщик базы", "Üs planlayıcı", "Planer Bazy", "Planificador de Base", "Planejador de Base", "Basisplaner", "기지 플래너", "基地プランナー", "基地规划器"],
    ["Producer ROI", "ROI des producteurs", "ROI производителей", "Üretici ROI", "ROI producenta", "ROI de productores", "ROI de produtores", "Produzenten-ROI", "생산 시설 ROI", "生産施設ROI", "生产设施 ROI"],
    ["Promo Codes", "Codes promo", "Промокоды", "Promosyon Kodları", "Kody promocyjne", "Códigos promocionales", "Códigos promocionais", "Promo-Codes", "프로모션 코드", "プロモーションコード", "兑换码"],
    ["Codes", "Codes", "Коды", "Kodlar", "Kody", "Códigos", "Códigos", "Codes", "코드", "コード", "兑换码"],
    ["Install", "Installer", "Установить", "Yükle", "Zainstaluj", "Instalar", "Instalar", "Installieren", "설치", "インストール", "安装"],
    ["GitHub ↗", "GitHub ↗", "GitHub ↗", "GitHub ↗", "GitHub ↗", "GitHub ↗", "GitHub ↗", "GitHub ↗", "GitHub ↗", "GitHub ↗", "GitHub ↗"],
    ["Base progression intelligence", "Intelligence de progression de la Base", "Аналитика развития базы", "Üs ilerleme analizi", "Analiza rozwoju Bazy", "Inteligencia de progresión de Base", "Inteligência de progressão da Base", "Basis-Fortschrittsanalyse", "기지 진행 분석", "基地進行インテリジェンス", "基地进度分析"],
    ["Your route to Base 30", "Votre route vers la Base 30", "Ваш путь к базе 30", "Üs 30'a giden yolunuz", "Twoja droga do Bazy 30", "Tu ruta a Base 30", "Seu caminho até a Base 30", "Dein Weg zu Basis 30", "기지 30까지의 경로", "基地30までの道のり", "你的基地 30 路线"],
    ["Know what the next Base levels really cost.", "Découvrez le vrai coût des prochains niveaux de Base.", "Узнайте настоящую стоимость следующих уровней базы.", "Sonraki Üs seviyelerinin gerçek maliyetini öğrenin.", "Poznaj rzeczywisty koszt kolejnych poziomów Bazy.", "Descubre cuánto cuestan realmente los siguientes niveles de Base.", "Saiba quanto custam realmente os próximos níveis da Base.", "Erfahre, was die nächsten Basislevel wirklich kosten.", "다음 기지 레벨에 실제로 필요한 비용을 확인하세요.", "次の基地レベルに本当に必要なコストを確認できます。", "了解下一个基地等级的真实成本。"],
    ["Select your current Base level to see every remaining upgrade through level 30.", "Sélectionnez votre niveau de Base actuel pour voir chaque amélioration restante jusqu'au niveau 30.", "Выберите текущий уровень базы, чтобы увидеть все оставшиеся улучшения до уровня 30.", "Kalan tüm yükseltmeleri 30. seviyeye kadar görmek için mevcut Üs seviyenizi seçin.", "Wybierz obecny poziom Bazy, aby zobaczyć wszystkie pozostałe ulepszenia do poziomu 30.", "Selecciona tu nivel actual de Base para ver todas las mejoras restantes hasta el nivel 30.", "Selecione o nível atual da sua Base para ver todas as melhorias restantes até ao nível 30.", "Wähle dein aktuelles Basislevel, um alle verbleibenden Verbesserungen bis Level 30 zu sehen.", "현재 기지 레벨을 선택하면 레벨 30까지 남은 모든 업그레이드를 볼 수 있습니다.", "現在の基地レベルを選択すると、レベル30までの残りのアップグレードをすべて確認できます。", "选择当前基地等级，查看直到 30 级的所有剩余升级。"],
    ["Plan direct Base upgrades, recursive building requirements, and per-building construction workloads from your actual account state.", "Planifiez les améliorations directes de la Base, les prérequis de bâtiments récursifs et les travaux de construction par bâtiment depuis l'état réel de votre compte.", "Планируйте прямые улучшения базы, рекурсивные требования зданий и объём строительства каждого здания, исходя из состояния вашего аккаунта.", "Gerçek hesap durumunuzdan doğrudan Üs yükseltmelerini, özyinelemeli bina gereksinimlerini ve bina başına inşaat işlerini planlayın.", "Planuj bezpośrednie ulepszenia Bazy, rekurencyjne wymagania budynków i zakres prac dla każdego budynku na podstawie stanu konta.", "Planifica mejoras directas de Base, requisitos recursivos de edificios y trabajos de construcción por edificio desde el estado real de tu cuenta.", "Planeje melhorias diretas da Base, requisitos recursivos de edifícios e o trabalho de construção de cada edifício a partir do estado real da sua conta.", "Plane direkte Basis-Upgrades, rekursive Gebäudeanforderungen und den Bauaufwand je Gebäude anhand deines tatsächlichen Kontostands.", "실제 계정 상태를 기준으로 기지 업그레이드, 재귀적 건물 조건, 건물별 건설 작업량을 계획하세요.", "実際のアカウント状態から、基地の直接アップグレード、建物の再帰的な条件、建物ごとの建設作業量を計画できます。", "根据你的实际账户状态，规划基地直接升级、递归建筑要求和每栋建筑的建造工作量。"],
    ["Your progression", "Votre progression", "Развитие", "İlerlemeniz", "Twój postęp", "Tu progreso", "Seu progresso", "Dein Fortschritt", "진행 상황", "進行状況", "你的进度"],
    ["Select your current Base level. Building overrides and speed settings are optional.", "Sélectionnez votre niveau de Base actuel. Les remplacements de bâtiments et les paramètres de vitesse sont facultatifs.", "Выберите текущий уровень базы. Переопределение зданий и настройки скорости необязательны.", "Mevcut Üs seviyenizi seçin. Bina geçersiz kılmaları ve hız ayarları isteğe bağlıdır.", "Wybierz obecny poziom Bazy. Nadpisania budynków i ustawienia szybkości są opcjonalne.", "Selecciona tu nivel actual de Base. Los ajustes de edificios y velocidad son opcionales.", "Selecione o nível atual da Base. As substituições de edifícios e as definições de velocidade são opcionais.", "Wähle dein aktuelles Basislevel. Gebäudeüberschreibungen und Geschwindigkeitseinstellungen sind optional.", "현재 기지 레벨을 선택하세요. 건물 재정의와 속도 설정은 선택 사항입니다.", "現在の基地レベルを選択してください。建物の上書きと速度設定は任意です。", "选择当前基地等级。建筑覆盖和速度设置均为可选项。"],
    ["Set your Base levels to see the prerequisite checklist, build time, and total resource cost. Open advanced settings only when you need them.", "Définissez vos niveaux de Base pour voir la liste des prérequis, le temps de construction et le coût total en ressources. Ouvrez les paramètres avancés uniquement si nécessaire.", "Укажите уровни базы, чтобы увидеть список требований, время строительства и общую стоимость ресурсов. Открывайте расширенные настройки только при необходимости.", "Ön koşul listesini, inşa süresini ve toplam kaynak maliyetini görmek için Üs seviyelerinizi ayarlayın. Gelişmiş ayarları yalnızca gerektiğinde açın.", "Ustaw poziomy Bazy, aby zobaczyć listę wymagań, czas budowy i łączny koszt zasobów. Ustawienia zaawansowane otwieraj tylko wtedy, gdy ich potrzebujesz.", "Establece tus niveles de Base para ver la lista de requisitos, el tiempo de construcción y el coste total de recursos. Abre los ajustes avanzados solo cuando los necesites.", "Defina os níveis da Base para ver a lista de pré-requisitos, o tempo de construção e o custo total de recursos. Abra as definições avançadas apenas quando precisar.", "Lege deine Basislevel fest, um die Voraussetzungen, Bauzeit und gesamten Ressourcenkosten zu sehen. Öffne die erweiterten Einstellungen nur bei Bedarf.", "기지 레벨을 설정하면 선행 조건, 건설 시간 및 총 자원 비용을 확인할 수 있습니다. 필요할 때만 고급 설정을 여세요.", "基地レベルを設定すると、前提条件の一覧、建設時間、必要資源の合計を確認できます。必要な場合のみ詳細設定を開いてください。", "设置基地等级即可查看前置条件清单、建造时间和资源总成本。仅在需要时打开高级设置。"],
    ["Input detail", "Détails des entrées", "Детализация ввода", "Girdi ayrıntısı", "Szczegóły danych wejściowych", "Detalle de entrada", "Detalhes da entrada", "Eingabedetails", "입력 상세", "入力の詳細", "输入详情"],
    ["Base only", "Base uniquement", "Только база", "Yalnızca Üs", "Tylko Baza", "Solo Base", "Apenas Base", "Nur Basis", "기지만", "基地のみ", "仅基地"],
    ["Building levels", "Niveaux des bâtiments", "Уровни зданий", "Bina seviyeleri", "Poziomy budynków", "Niveles de edificios", "Níveis dos edifícios", "Gebäudelevel", "건물 레벨", "建物レベル", "建筑等级"],
    ["Current Base level", "Niveau actuel de la Base", "Текущий уровень базы", "Mevcut Üs seviyesi", "Obecny poziom Bazy", "Nivel actual de Base", "Nível atual da Base", "Aktuelles Basislevel", "현재 기지 레벨", "現在の基地レベル", "当前基地等级"],
    ["infer prerequisites", "déduire les prérequis", "определить пререквизиты", "ön koşulları çıkar", "wywnioskuj wymagania", "inferir requisitos", "inferir pré-requisitos", "Voraussetzungen ableiten", "선행 조건 추론", "前提条件を推定", "推断前置条件"],
    ["Target Base level", "Niveau de Base cible", "Целевой уровень базы", "Hedef Üs seviyesi", "Docelowy poziom Bazy", "Nivel objetivo de Base", "Nível alvo da Base", "Ziel-Basislevel", "목표 기지 레벨", "目標基地レベル", "目标基地等级"],
    ["Advanced: builders & speed bonuses", "Avancé : constructeurs et bonus de vitesse", "Расширенные: строители и бонусы скорости", "Gelişmiş: inşaatçılar ve hız bonusları", "Zaawansowane: budowniczowie i premie szybkości", "Avanzado: constructores y bonificaciones de velocidad", "Avançado: construtores e bónus de velocidade", "Erweitert: Bauarbeiter & Geschwindigkeitsboni", "고급: 건설자 및 속도 보너스", "詳細設定：建設枠と速度ボーナス", "高级设置：建造位和速度加成"],
    ["Builder slots", "Emplacements de constructeurs", "Слоты строителей", "İnşaatçı yuvaları", "Miejsca budowniczych", "Espacios de constructores", "Espaços de construtor", "Bauplätze", "건설자 슬롯", "建設枠", "建造位"],
    ["VIP level", "Niveau VIP", "Уровень VIP", "VIP seviyesi", "Poziom VIP", "Nivel VIP", "Nível VIP", "VIP-Level", "VIP 레벨", "VIPレベル", "VIP 等级"],
    ["Quick Construction research", "Recherche Construction rapide", "Исследование «Быстрое строительство»", "Hızlı İnşaat araştırması", "Badania nad szybkim budowaniem", "Investigación de construcción rápida", "Pesquisa de construção rápida", "Forschung „Schnelles Bauen“", "빠른 건설 연구", "クイック建設研究", "快速建造研究"],
    ["Free-finish time", "Temps de finition gratuite", "Время бесплатного завершения", "Ücretsiz bitirme süresi", "Czas darmowego ukończenia", "Tiempo de finalización gratuita", "Tempo de conclusão grátis", "Kostenlose Abschlusszeit", "무료 완료 시간", "無料完了時間", "免费完成时间"],
    ["minutes", "minutes", "минут", "dakika", "minuty", "minutos", "minutos", "Minuten", "분", "分", "分钟"],
    ["Other speed", "Autre vitesse", "Другая скорость", "Diğer hız", "Inna szybkość", "Otra velocidad", "Outra velocidade", "Andere Geschwindigkeit", "기타 속도", "その他の速度", "其他速度"],
    ["%", "%", "%", "%", "%", "%", "%", "%", "%", "%", "%"],
    ["VIP and research add Building Speed. Survivors add free-finish time instead; enter the total shown in game. Alliance help and temporary buffs can go under Other speed.", "Le VIP et la recherche ajoutent de la vitesse de construction. Les survivants ajoutent du temps de finition gratuite ; saisissez le total affiché dans le jeu. L'aide de l'alliance et les bonus temporaires peuvent être saisis dans Autre vitesse.", "VIP и исследования добавляют скорость строительства. Выжившие вместо этого дают время бесплатного завершения; введите общую величину из игры. Помощь альянса и временные усиления можно указать в поле «Другая скорость».", "VIP ve araştırmalar İnşaat Hızı ekler. Hayatta kalanlar bunun yerine ücretsiz bitirme süresi sağlar; oyunda gösterilen toplamı girin. İttifak yardımı ve geçici güçlendirmeler Diğer hız alanına yazılabilir.", "VIP i badania zwiększają szybkość budowy. Ocaleni dodają czas darmowego ukończenia; wpisz łączną wartość widoczną w grze. Pomoc sojuszu i tymczasowe wzmocnienia możesz dodać jako Inną szybkość.", "El VIP y las investigaciones añaden velocidad de construcción. Los supervivientes añaden tiempo de finalización gratuita; introduce el total que aparece en el juego. La ayuda de la alianza y las bonificaciones temporales pueden añadirse en Otra velocidad.", "O VIP e a investigação adicionam Velocidade de construção. Os sobreviventes adicionam tempo de conclusão grátis; introduza o total mostrado no jogo. A ajuda da aliança e os bónus temporários podem ser incluídos em Outra velocidade.", "VIP und Forschung erhöhen die Baugeschwindigkeit. Überlebende geben stattdessen kostenlose Abschlusszeit; gib den Gesamtwert aus dem Spiel ein. Allianz-Hilfe und zeitlich begrenzte Boni kannst du unter Andere Geschwindigkeit eintragen.", "VIP와 연구는 건설 속도를 높입니다. 생존자는 대신 무료 완료 시간을 추가하므로 게임에 표시된 총 시간을 입력하세요. 연맹 지원과 임시 버프는 기타 속도에 입력할 수 있습니다.", "VIPと研究は建設速度を加算します。サバイバーは代わりに無料完了時間を追加するため、ゲームに表示された合計値を入力してください。同盟ヘルプと一時バフはその他の速度に入力できます。", "VIP 和研究会增加建造速度。幸存者会改为增加免费完成时间；请输入游戏中显示的总值。联盟帮助和临时增益可填入其他速度。"],
    ["Override inferred building levels", "Remplacer les niveaux de bâtiments déduits", "Переопределить рассчитанные уровни зданий", "Çıkarılan bina seviyelerini geçersiz kıl", "Nadpisz wywnioskowane poziomy budynków", "Anular los niveles de edificios inferidos", "Substituir níveis de edifícios inferidos", "Abgeleitete Gebäudelevel überschreiben", "추론된 건물 레벨 재정의", "推定された建物レベルを上書き", "覆盖推断的建筑等级"],
    ["Current building levels", "Niveaux actuels des bâtiments", "Текущие уровни зданий", "Mevcut bina seviyeleri", "Bieżące poziomy budynków", "Niveles actuales de edificios", "Níveis atuais dos edifícios", "Aktuelle Gebäudelevel", "현재 건물 레벨", "現在の建物レベル", "当前建筑等级"],
    ["Auto follows the minimum route implied by your current Base. Override any exception.", "Suit automatiquement l'itinéraire minimal déduit de votre Base actuelle. Remplacez toute exception.", "Автоматически следует минимальному маршруту, заданному текущим уровнем базы. Переопределите исключения.", "Mevcut Üs seviyenizin gerektirdiği minimum rotayı otomatik izler. İstisnaları geçersiz kılın.", "Automatycznie podąża za minimalną trasą wynikającą z obecnej Bazy. Nadpisz dowolny wyjątek.", "Sigue automáticamente la ruta mínima implícita en tu Base actual. Ajusta cualquier excepción.", "Segue automaticamente a rota mínima indicada pela sua Base atual. Substitua qualquer exceção.", "Folgt automatisch dem durch dein aktuelles Basislevel bestimmten Mindestweg. Überschreibe Ausnahmen nach Bedarf.", "현재 기지에서 추론한 최소 경로를 자동으로 따릅니다. 예외 사항은 직접 설정하세요.", "現在の基地から推定した最小ルートに自動的に従います。例外は上書きできます。", "自动遵循当前基地等级推导出的最短路线。可覆盖任意例外。"],
    ["Levels above your target are allowed and count as already complete.", "Les niveaux supérieurs à votre objectif sont autorisés et comptent comme déjà terminés.", "Уровни выше цели разрешены и считаются уже завершёнными.", "Hedefinizin üzerindeki seviyelere izin verilir ve bunlar zaten tamamlanmış sayılır.", "Poziomy powyżej celu są dozwolone i liczą się jako ukończone.", "Se permiten niveles superiores al objetivo y cuentan como ya completados.", "São permitidos níveis acima do alvo e contam como já concluídos.", "Level über dem Ziel sind erlaubt und gelten als bereits abgeschlossen.", "목표보다 높은 레벨도 허용되며 이미 완료된 것으로 계산됩니다.", "目標より上のレベルも設定でき、完了済みとして扱われます。", "允许高于目标的等级，并视为已完成。"],
    ["Any-of training gates choose the center needing the least remaining builder work.", "Les portes d'entraînement « l'un ou l'autre » choisissent le centre nécessitant le moins de travail de construction restant.", "Варианты тренировочных требований выбирают центр с наименьшим оставшимся объёмом строительства.", "Herhangi bir eğitim kapısı, kalan inşaat işi en az olan merkezi seçer.", "Wymagania typu „dowolny” wybierają centrum z najmniejszą pozostałą pracą budowlaną.", "Las puertas de entrenamiento de tipo «cualquiera» eligen el centro que necesita menos trabajo de construcción restante.", "Os requisitos de treino «qualquer» escolhem o centro com menos trabalho de construção restante.", "„Beliebiges“-Trainingsvoraussetzungen wählen das Zentrum mit dem geringsten verbleibenden Bauaufwand.", "선택형 훈련 조건은 남은 건설 작업이 가장 적은 센터를 선택합니다.", "いずれかの訓練条件では、残りの建設作業が最も少ないセンターを選びます。", "“任选其一”训练条件会选择剩余建造工作量最少的中心。"],
    ["Export JSON", "Exporter le JSON", "Экспортировать JSON", "JSON dışa aktar", "Eksportuj JSON", "Exportar JSON", "Exportar JSON", "JSON exportieren", "JSON 내보내기", "JSONをエクスポート", "导出 JSON"],
    ["Import JSON", "Importer le JSON", "Импортировать JSON", "JSON içe aktar", "Importuj JSON", "Importar JSON", "Importar JSON", "JSON importieren", "JSON 가져오기", "JSONをインポート", "导入 JSON"],
    ["Configuration exported.", "Configuration exportée.", "Конфигурация экспортирована.", "Yapılandırma dışa aktarıldı.", "Konfiguracja wyeksportowana.", "Configuración exportada.", "Configuração exportada.", "Konfiguration exportiert.", "구성이 내보내졌습니다.", "設定をエクスポートしました。", "配置已导出。"],
    ["Configuration imported.", "Configuration importée.", "Конфигурация импортирована.", "Yapılandırma içe aktarıldı.", "Konfiguracja zaimportowana.", "Configuración importada.", "Configuração importada.", "Konfiguration importiert.", "구성을 가져왔습니다.", "設定をインポートしました。", "配置已导入。"],
    ["Loading verified client data…", "Chargement des données client vérifiées…", "Загрузка проверенных данных клиента…", "Doğrulanmış istemci verileri yükleniyor…", "Wczytywanie zweryfikowanych danych klienta…", "Cargando datos verificados del cliente…", "A carregar dados verificados do cliente…", "Verifizierte Clientdaten werden geladen …", "검증된 클라이언트 데이터 로드 중…", "検証済みクライアントデータを読み込んでいます…", "正在加载已验证的客户端数据…"],
    ["Remaining route", "Itinéraire restant", "Оставшийся маршрут", "Kalan rota", "Pozostała trasa", "Ruta restante", "Rota restante", "Verbleibender Weg", "남은 경로", "残りのルート", "剩余路线"],
    ["Client v1.30.07", "Client v1.30.07", "Клиент v1.30.07", "İstemci v1.30.07", "Klient v1.30.07", "Cliente v1.30.07", "Cliente v1.30.07", "Client v1.30.07", "클라이언트 v1.30.07", "クライアント v1.30.07", "客户端 v1.30.07"],
    ["Estimated elapsed", "Temps écoulé estimé", "Расчётное время", "Tahmini geçen süre", "Szacowany czas", "Tiempo transcurrido estimado", "Tempo decorrido estimado", "Geschätzte verstrichene Zeit", "예상 경과 시간", "推定経過時間", "预计耗时"],
    ["Adjusted Base work", "Travail ajusté de la Base", "Скорректированная работа базы", "Ayarlanmış Üs işi", "Dostosowana praca Bazy", "Trabajo ajustado de Base", "Trabalho ajustado da Base", "Angepasster Basisaufwand", "조정된 기지 작업", "調整後の基地作業", "调整后的基地工作量"],
    ["Food required", "Nourriture requise", "Требуется еды", "Gerekli yiyecek", "Wymagana żywność", "Comida necesaria", "Comida necessária", "Benötigte Nahrung", "필요한 식량", "必要な食料", "所需食物"],
    ["Metal required", "Métal requis", "Требуется металла", "Gerekli metal", "Wymagany metal", "Metal necesario", "Metal necessário", "Benötigtes Metall", "필요한 금속", "必要な金属", "所需金属"],
    ["Oil required", "Pétrole requis", "Требуется нефти", "Gerekli petrol", "Wymagana ropa", "Petróleo necesario", "Petróleo necessário", "Benötigtes Öl", "필요한 석유", "必要な石油", "所需石油"],
    ["Prerequisite-aware builder schedule", "Planning des constructeurs tenant compte des prérequis", "Расписание строителей с учётом требований", "Ön koşulları dikkate alan inşaatçı programı", "Harmonogram budowniczych z uwzględnieniem wymagań", "Calendario de constructores con requisitos previos", "Agenda de construtores com pré-requisitos", "Bauplan der Bauarbeiter unter Berücksichtigung von Voraussetzungen", "선행 조건을 반영한 건설자 일정", "前提条件を考慮した建設枠スケジュール", "考虑前置条件的建造安排"],
    ["Planning totals", "Totaux du plan", "Итоги планирования", "Planlama toplamları", "Podsumowanie planu", "Totales de planificación", "Totais do planeamento", "Planungsübersicht", "계획 합계", "計画合計", "规划总计"],
    ["Building workloads", "Charge de travail des bâtiments", "Работы по зданиям", "Bina iş yükleri", "Zakres prac budowlanych", "Trabajos de edificios", "Carga de trabalho dos edifícios", "Gebäudeaufwand", "건물 작업량", "建物ごとの作業量", "建筑工作量"],
    ["Adjusted time by building; the elapsed estimate respects prerequisite order and selected slots.", "Temps ajusté par bâtiment ; l'estimation écoulée respecte l'ordre des prérequis et les emplacements sélectionnés.", "Скорректированное время по зданиям; расчёт учитывает порядок требований и выбранные слоты.", "Bina başına ayarlanmış süre; geçen süre tahmini ön koşul sırasını ve seçilen yuvaları dikkate alır.", "Dostosowany czas dla budynku; szacunek uwzględnia kolejność wymagań i wybrane miejsca.", "Tiempo ajustado por edificio; la estimación respeta el orden de requisitos y los espacios seleccionados.", "Tempo ajustado por edifício; a estimativa respeita a ordem dos pré-requisitos e os espaços selecionados.", "Angepasste Zeit je Gebäude; die Schätzung berücksichtigt die Reihenfolge der Voraussetzungen und die ausgewählten Bauplätze.", "건물별 조정 시간이며 선행 조건 순서와 선택한 슬롯을 반영합니다.", "建物ごとの調整時間です。経過時間の推定は前提条件の順序と選択した枠を考慮します。", "按建筑显示调整后的时间；耗时估算会遵循前置条件顺序和所选建造位。"],
    ["Level-by-level route", "Itinéraire niveau par niveau", "Маршрут по уровням", "Seviye seviye rota", "Trasa poziom po poziomie", "Ruta nivel a nivel", "Rota nível a nível", "Weg nach Level", "레벨별 경로", "レベルごとのルート", "逐级路线"],
    ["Resources are incremental from the preceding Base level.", "Les ressources sont supplémentaires par rapport au niveau de Base précédent.", "Ресурсы указаны как прирост относительно предыдущего уровня базы.", "Kaynaklar bir önceki Üs seviyesine göre artış olarak gösterilir.", "Zasoby są przyrostowe względem poprzedniego poziomu Bazy.", "Los recursos son incrementales respecto al nivel de Base anterior.", "Os recursos são incrementais em relação ao nível anterior da Base.", "Ressourcen werden zusätzlich zum vorherigen Basislevel angegeben.", "자원은 이전 기지 레벨에서 증가한 양입니다.", "資源は直前の基地レベルからの増分です。", "资源按相对于上一个基地等级的增量显示。"],
    ["Base", "Base", "База", "Üs", "Baza", "Base", "Base", "Basis", "기지", "基地", "基地"],
    ["Base time", "Temps de Base", "Время базы", "Üs süresi", "Czas Bazy", "Tiempo de Base", "Tempo da Base", "Basiszeit", "기지 시간", "基地時間", "基地时间"],
    ["Total resources", "Ressources totales", "Общие ресурсы", "Toplam kaynaklar", "Łączne zasoby", "Recursos totales", "Recursos totais", "Gesamte Ressourcen", "총 자원", "合計リソース", "总资源"],
    ["Missing prerequisite work", "Travail des prérequis manquants", "Работа недостающих требований", "Eksik ön koşul işi", "Brakujące prace wymagane", "Trabajo de requisitos faltantes", "Trabalho de pré-requisitos em falta", "Fehlender Voraussetzungen-Aufwand", "누락된 선행 작업", "不足している前提作業", "缺少的前置工作"],
    ["No prerequisite building work remains for this target.", "Il ne reste aucun travail de bâtiment prérequis pour cette cible.", "Для этой цели не осталось работ по зданиям-пререквизитам.", "Bu hedef için ön koşul bina işi kalmadı.", "Dla tego celu nie pozostała żadna praca wymagana od budynków.", "No queda trabajo de edificios requisito para este objetivo.", "Não há trabalho de edifícios pré-requisito restante para este alvo.", "Für dieses Ziel sind keine Arbeiten an vorausgesetzten Gebäuden mehr nötig.", "이 목표에는 남은 선행 건물 작업이 없습니다.", "この目標に必要な前提建物の作業は残っていません。", "此目标不再需要额外的前置建筑工作。"],
    ["Target already reached. Raise the target to see remaining work.", "Objectif déjà atteint. Augmentez la cible pour voir le travail restant.", "Цель уже достигнута. Увеличьте её, чтобы увидеть оставшиеся работы.", "Hedefe zaten ulaşıldı. Kalan işleri görmek için hedefi yükseltin.", "Cel został już osiągnięty. Zwiększ go, aby zobaczyć pozostałe prace.", "El objetivo ya se ha alcanzado. Aumenta el objetivo para ver el trabajo restante.", "O alvo já foi alcançado. Aumente-o para ver o trabalho restante.", "Das Ziel ist bereits erreicht. Erhöhe es, um den verbleibenden Aufwand zu sehen.", "목표에 이미 도달했습니다. 남은 작업을 보려면 목표를 높이세요.", "目標はすでに達成されています。残りの作業を見るには目標を上げてください。", "已达到目标。提高目标即可查看剩余工作。"],
    ["None", "Aucun", "Нет", "Yok", "Brak", "Ninguno", "Nenhum", "Keine", "없음", "なし", "无"],
    ["Level", "Niveau", "Уровень", "Seviye", "Poziom", "Nivel", "Nível", "Level", "레벨", "レベル", "等级"],
    ["Required buildings", "Bâtiments requis", "Требуемые здания", "Gerekli binalar", "Wymagane budynki", "Edificios necesarios", "Edifícios necessários", "Benötigte Gebäude", "필요한 건물", "必要な建物", "所需建筑"],
    ["Stage resources", "Ressources de l'étape", "Ресурсы этапа", "Aşama kaynakları", "Zasoby etapu", "Recursos de la etapa", "Recursos da etapa", "Ressourcen der Stufe", "단계 자원", "ステージ資源", "阶段资源"],
    ["Base upgrade", "Amélioration de la Base", "Улучшение базы", "Üs yükseltmesi", "Ulepszenie Bazy", "Mejora de Base", "Melhoria da Base", "Basis-Upgrade", "기지 업그레이드", "基地アップグレード", "基地升级"],
    ["Upgrade details", "Détails de l'amélioration", "Подробности улучшения", "Yükseltme ayrıntıları", "Szczegóły ulepszenia", "Detalles de la mejora", "Detalhes da melhoria", "Upgrade-Details", "업그레이드 세부 정보", "アップグレード詳細", "升级详情"],
    ["No additional building upgrades needed.", "Aucune autre amélioration de bâtiment n'est nécessaire.", "Дополнительные улучшения зданий не требуются.", "Ek bina yükseltmesi gerekmiyor.", "Nie są potrzebne dodatkowe ulepszenia budynków.", "No se necesitan más mejoras de edificios.", "Não são necessárias melhorias adicionais de edifícios.", "Keine weiteren Gebäude-Upgrades erforderlich.", "추가 건물 업그레이드가 필요하지 않습니다.", "追加の建物アップグレードは不要です。", "无需额外升级建筑。"],
    ["Resources include the Base upgrade and all missing building prerequisites for this stage.", "Les ressources incluent l'amélioration de la Base et tous les prérequis de bâtiments manquants pour cette étape.", "Ресурсы включают улучшение базы и все недостающие требования зданий для этого этапа.", "Kaynaklar, Üs yükseltmesini ve bu aşama için eksik tüm bina ön koşullarını içerir.", "Zasoby obejmują ulepszenie Bazy i wszystkie brakujące wymagania budynków dla tego etapu.", "Los recursos incluyen la mejora de Base y todos los requisitos de edificios que faltan en esta etapa.", "Os recursos incluem a melhoria da Base e todos os pré-requisitos de edifícios em falta nesta etapa.", "Die Ressourcen umfassen das Basis-Upgrade und alle fehlenden Gebäudevoraussetzungen für diese Stufe.", "자원에는 기지 업그레이드와 이 단계에 필요한 모든 누락된 건물 선행 조건이 포함됩니다.", "資源には基地のアップグレードと、この段階で不足しているすべての建物前提条件が含まれます。", "资源包括基地升级以及此阶段缺少的所有建筑前置条件。"],
    ["Base 30 reached", "Base 30 atteinte", "Достигнута база 30", "Üs 30'a ulaşıldı", "Osiągnięto Bazę 30", "Base 30 alcanzada", "Base 30 alcançada", "Basis 30 erreicht", "기지 30 도달", "基地30に到達", "已达到基地 30"],
    ["Resource investment intelligence", "Analyse de l'investissement en ressources", "Аналитика вложений ресурсов", "Kaynak yatırım analizi", "Analiza inwestycji zasobów", "Inteligencia de inversión de recursos", "Inteligência de investimento em recursos", "Analyse von Ressourceninvestitionen", "자원 투자 분석", "資源投資インテリジェンス", "资源投资分析"],
    ["Know when a producer upgrade pays you back.", "Sachez quand l'amélioration d'un producteur est rentabilisée.", "Узнайте, когда улучшение производства окупится.", "Bir üretici yükseltmesinin ne zaman kendini amorti edeceğini öğrenin.", "Sprawdź, kiedy ulepszenie producenta się zwróci.", "Descubre cuándo una mejora de productor te compensa.", "Saiba quando uma melhoria do produtor recupera o investimento.", "Erfahre, wann sich ein Produzenten-Upgrade bezahlt macht.", "생산 시설 업그레이드가 언제 투자금을 회수하는지 확인하세요.", "生産施設のアップグレードがいつ元を取るか確認できます。", "了解生产设施升级何时能回本。"],
    ["Compare construction cost against the added hourly output of Farms, Metal and Oil producers, Training Grounds, and material factories.", "Comparez le coût de construction à la production horaire supplémentaire des fermes, producteurs de métal et de pétrole, terrains d'entraînement et usines de matériaux.", "Сравнивайте стоимость строительства с дополнительной выработкой в час ферм, производителей металла и нефти, тренировочных площадок и фабрик материалов.", "Çiftliklerin, metal ve petrol üreticilerinin, Eğitim Alanlarının ve malzeme fabrikalarının ek saatlik üretimini inşaat maliyetiyle karşılaştırın.", "Porównuj koszt budowy z dodatkową produkcją na godzinę farm, producentów metalu i ropy, poligonów oraz fabryk materiałów.", "Compara el coste de construcción con la producción horaria adicional de granjas, productores de metal y petróleo, campos de entrenamiento y fábricas de materiales.", "Compare o custo de construção com a produção horária adicional de fazendas, produtores de metal e petróleo, campos de treino e fábricas de materiais.", "Vergleiche die Baukosten mit dem zusätzlichen Stundenertrag von Farmen, Metall- und Ölproduzenten, Trainingsplätzen und Materialfabriken.", "농장, 금속·석유 생산 시설, 훈련장 및 재료 공장의 시간당 추가 생산량과 건설 비용을 비교하세요.", "農場、金属・石油生産施設、訓練場、素材工場の追加時間生産量と建設コストを比較できます。", "比较农场、金属和石油生产设施、训练场及材料工厂的建造成本与每小时新增产量。"],
    ["Investment assumptions", "Hypothèses d'investissement", "Параметры вложений", "Yatırım varsayımları", "Założenia inwestycji", "Supuestos de inversión", "Pressupostos de investimento", "Investitionsannahmen", "투자 가정", "投資条件", "投资假设"],
    ["Payback uses only the extra output gained by upgrading. Production continues at the last completed level during construction.", "Le retour sur investissement utilise uniquement la production supplémentaire gagnée par l'amélioration. La production continue au dernier niveau terminé pendant la construction.", "Окупаемость учитывает только дополнительную выработку от улучшения. Во время строительства производство продолжается на последнем завершённом уровне.", "Geri ödeme yalnızca yükseltmeyle kazanılan ek üretimi kullanır. İnşaat sırasında üretim son tamamlanan seviyede devam eder.", "Okres zwrotu uwzględnia tylko dodatkową produkcję z ulepszenia. Podczas budowy produkcja trwa na ostatnim ukończonym poziomie.", "El retorno solo usa la producción adicional obtenida con la mejora. Durante la construcción, la producción continúa en el último nivel completado.", "O retorno usa apenas a produção adicional obtida com a melhoria. Durante a construção, a produção continua no último nível concluído.", "Die Amortisation berücksichtigt nur den zusätzlichen Ertrag durch das Upgrade. Während des Baus läuft die Produktion auf dem zuletzt abgeschlossenen Level weiter.", "회수 기간은 업그레이드로 얻는 추가 생산량만 사용합니다. 건설 중에는 마지막으로 완료한 레벨의 생산이 계속됩니다.", "回収時間はアップグレードで増える追加生産だけを使用します。建設中も最後に完了したレベルで生産が続きます。", "回本时间只计算升级带来的额外产量。建造期间会继续按最后完成的等级生产。"],
    ["Producer", "Producteur", "Производитель", "Üretici", "Producent", "Productor", "Produtor", "Produzent", "생산 시설", "生産施設", "生产设施"],
    ["Current level", "Niveau actuel", "Текущий уровень", "Mevcut seviye", "Obecny poziom", "Nivel actual", "Nível atual", "Aktuelles Level", "현재 레벨", "現在のレベル", "当前等级"],
    ["Target level", "Niveau cible", "Целевой уровень", "Hedef seviye", "Docelowy poziom", "Nivel objetivo", "Nível alvo", "Ziel-Level", "목표 레벨", "目標レベル", "目标等级"],
    ["Construction speed", "Vitesse de construction", "Скорость строительства", "İnşaat hızı", "Szybkość budowy", "Velocidad de construcción", "Velocidade de construção", "Baugeschwindigkeit", "건설 속도", "建設速度", "建造速度"],
    ["Production bonus", "Bonus de production", "Бонус производства", "Üretim bonusu", "Premia produkcji", "Bonificación de producción", "Bónus de produção", "Produktionsbonus", "생산 보너스", "生産ボーナス", "生产加成"],
    ["Collection uptime", "Disponibilité de collecte", "Время сбора", "Toplama çalışma süresi", "Czas aktywnego zbierania", "Tiempo de recolección activo", "Tempo de recolha ativo", "Sammelverfügbarkeit", "수집 가동 시간", "収集稼働率", "采集在线率"],
    ["Relative resource values", "Valeurs relatives des ressources", "Относительная ценность ресурсов", "Göreli kaynak değerleri", "Względne wartości zasobów", "Valores relativos de los recursos", "Valores relativos dos recursos", "Relative Ressourcenwerte", "상대 자원 가치", "資源の相対価値", "资源相对价值"],
    ["Value of one unit in a common comparison unit. Defaults treat Food, Metal, and Oil equally; set the produced resource to reflect how valuable it is to you.", "Valeur d'une unité dans une unité de comparaison commune. Par défaut, la nourriture, le métal et le pétrole ont la même valeur ; définissez la valeur de la ressource produite selon son importance pour vous.", "Стоимость одной единицы в общей единице сравнения. По умолчанию еда, металл и нефть равны; задайте ценность производимого ресурса по своему приоритету.", "Ortak bir karşılaştırma biriminde bir birimin değeri. Varsayılan olarak Yiyecek, Metal ve Petrol eşittir; üretilen kaynağın değerini sizin için önemine göre ayarlayın.", "Wartość jednej jednostki we wspólnej jednostce porównawczej. Domyślnie żywność, metal i ropa są równe; ustaw wartość produkowanego zasobu zgodnie z jego znaczeniem dla Ciebie.", "Valor de una unidad en una unidad común de comparación. Por defecto, comida, metal y petróleo valen lo mismo; ajusta el valor del recurso producido según su importancia para ti.", "Valor de uma unidade numa unidade de comparação comum. Por predefinição, comida, metal e petróleo têm o mesmo valor; defina o valor do recurso produzido de acordo com a sua importância.", "Wert einer Einheit in einer gemeinsamen Vergleichseinheit. Nahrung, Metall und Öl werden standardmäßig gleich bewertet; passe den Wert des produzierten Rohstoffs an seine Bedeutung für dich an.", "공통 비교 단위에서 1개의 가치입니다. 기본값은 식량, 금속, 석유를 동일하게 취급하므로 생산 자원의 가치를 중요도에 맞게 설정하세요.", "共通の比較単位における1単位の価値です。食料・金属・石油は初期設定で同価値なので、生産資源の重要度に合わせて設定してください。", "以通用比较单位表示 1 个单位的价值。默认将食物、金属和石油视为等值；请按你对产出资源的重视程度设置其价值。"],
    ["Loading verified producer data…", "Chargement des données vérifiées des producteurs…", "Загрузка проверенных данных производителей…", "Doğrulanmış üretici verileri yükleniyor…", "Wczytywanie zweryfikowanych danych producentów…", "Cargando datos verificados de productores…", "A carregar dados verificados dos produtores…", "Verifizierte Produzentendaten werden geladen …", "검증된 생산 시설 데이터 로드 중…", "検証済み生産施設データを読み込んでいます…", "正在加载已验证的生产设施数据…"],
    ["Producer investment", "Investissement du producteur", "Вложения в производство", "Üretici yatırımı", "Inwestycja w producenta", "Inversión del productor", "Investimento no produtor", "Produzenteninvestition", "생산 시설 투자", "生産施設への投資", "生产设施投资"],
    ["Runtime after target", "Temps après la cible", "Время после цели", "Hedef sonrası süre", "Czas po osiągnięciu celu", "Tiempo después del objetivo", "Tempo após o alvo", "Laufzeit nach dem Ziel", "목표 후 운영 시간", "目標後の稼働時間", "达到目标后的运行时间"],
    ["Additional time after all upgrades finish", "Temps supplémentaire après la fin de toutes les améliorations", "Дополнительное время после завершения всех улучшений", "Tüm yükseltmeler bittikten sonraki ek süre", "Dodatkowy czas po ukończeniu wszystkich ulepszeń", "Tiempo adicional después de completar todas las mejoras", "Tempo adicional após a conclusão de todas as melhorias", "Zusätzliche Zeit nach Abschluss aller Upgrades", "모든 업그레이드 완료 후 추가 시간", "すべてのアップグレード完了後の追加時間", "所有升级完成后的额外时间"],
    ["Total to break even", "Total avant rentabilité", "Общее время до окупаемости", "Başa baş için toplam süre", "Łączny czas do zwrotu", "Total hasta alcanzar el equilibrio", "Total até atingir o equilíbrio", "Gesamtzeit bis zum Break-even", "손익분기까지 총 시간", "損益分岐までの合計時間", "达到盈亏平衡的总时间"],
    ["From starting the first upgrade", "Depuis le début de la première amélioration", "С момента начала первого улучшения", "İlk yükseltmenin başlamasından itibaren", "Od rozpoczęcia pierwszego ulepszenia", "Desde el inicio de la primera mejora", "Desde o início da primeira melhoria", "Ab Beginn des ersten Upgrades", "첫 업그레이드 시작부터", "最初のアップグレード開始から", "从开始第一次升级算起"],
    ["Added output", "Production supplémentaire", "Дополнительная выработка", "Ek üretim", "Dodatkowa produkcja", "Producción adicional", "Produção adicional", "Zusätzlicher Ertrag", "추가 생산량", "追加生産量", "新增产量"],
    ["Direct upgrade costs", "Coûts directs des améliorations", "Прямые затраты на улучшения", "Doğrudan yükseltme maliyetleri", "Bezpośrednie koszty ulepszeń", "Costes directos de mejora", "Custos diretos das melhorias", "Direkte Upgrade-Kosten", "직접 업그레이드 비용", "直接アップグレードコスト", "直接升级成本"],
    ["Selected producer levels only", "Uniquement les niveaux sélectionnés du producteur", "Только выбранные уровни производителя", "Yalnızca seçilen üretici seviyeleri", "Tylko wybrane poziomy producenta", "Solo los niveles seleccionados del productor", "Apenas os níveis selecionados do produtor", "Nur ausgewählte Produzentenlevel", "선택한 생산 시설 레벨만", "選択した生産施設レベルのみ", "仅所选生产设施等级"],
    ["Investment value", "Valeur de l'investissement", "Стоимость вложений", "Yatırım değeri", "Wartość inwestycji", "Valor de la inversión", "Valor do investimento", "Investitionswert", "투자 가치", "投資価値", "投资价值"],
    ["Direct costs after relative weighting", "Coûts directs après pondération relative", "Прямые затраты с учётом относительных весов", "Göreli ağırlıklandırma sonrası doğrudan maliyetler", "Koszty bezpośrednie po uwzględnieniu wag względnych", "Costes directos tras la ponderación relativa", "Custos diretos após a ponderação relativa", "Direkte Kosten nach relativer Gewichtung", "상대 가중치 적용 후 직접 비용", "相対重み付け後の直接コスト", "相对加权后的直接成本"],
    ["Profit after 30 days", "Bénéfice après 30 jours", "Прибыль через 30 дней", "30 gün sonraki kâr", "Zysk po 30 dniach", "Beneficio después de 30 días", "Lucro após 30 dias", "Gewinn nach 30 Tagen", "30일 후 수익", "30日後の利益", "30天后的收益"],
    ["Weighted net value from construction start", "Valeur nette pondérée depuis le début de la construction", "Взвешенная чистая стоимость с начала строительства", "İnşaat başlangıcından itibaren ağırlıklı net değer", "Ważona wartość netto od rozpoczęcia budowy", "Valor neto ponderado desde el inicio de la construcción", "Valor líquido ponderado desde o início da construção", "Gewichteter Nettowert ab Baubeginn", "건설 시작부터의 가중 순가치", "建設開始からの加重純価値", "从建造开始计算的加权净值"],
    ["Upgrade-by-upgrade ROI", "ROI amélioration par amélioration", "Окупаемость каждого улучшения", "Yükseltme bazında ROI", "ROI dla każdego ulepszenia", "ROI de cada mejora", "ROI de cada melhoria", "ROI je Upgrade", "업그레이드별 ROI", "アップグレードごとのROI", "逐项升级 ROI"],
    ["Each row evaluates that level alone against its marginal output gain.", "Chaque ligne évalue ce niveau seul par rapport à son gain de production marginal.", "Каждая строка оценивает этот уровень отдельно по сравнению с приростом выработки.", "Her satır, ilgili seviyeyi marjinal üretim artışına göre tek başına değerlendirir.", "Każdy wiersz ocenia dany poziom osobno względem przyrostu produkcji.", "Cada fila evalúa ese nivel por separado frente a su ganancia de producción marginal.", "Cada linha avalia esse nível isoladamente face ao ganho marginal de produção.", "Jede Zeile bewertet dieses Level allein anhand seines zusätzlichen Ertrags.", "각 행은 해당 레벨만의 한계 생산량 증가를 기준으로 평가합니다.", "各行はそのレベル単体を限界生産量の増加と比較して評価します。", "每一行都会将该等级单独与其边际产量增益进行比较。"],
    ["Upgrade", "Amélioration", "Улучшение", "Yükseltme", "Ulepszenie", "Mejora", "Melhoria", "Upgrade", "업그레이드", "アップグレード", "升级"],
    ["Build time", "Temps de construction", "Время строительства", "İnşa süresi", "Czas budowy", "Tiempo de construcción", "Tempo de construção", "Bauzeit", "건설 시간", "建設時間", "建造时间"],
    ["Added / hour", "Ajouté / heure", "Добавлено / час", "Eklenen / saat", "Przyrost / godz.", "Añadido / hora", "Adicionado / hora", "Zusätzlich / Stunde", "추가 / 시간", "増加 / 時間", "新增 / 小时"],
    ["Cost", "Coût", "Стоимость", "Maliyet", "Koszt", "Coste", "Custo", "Kosten", "비용", "コスト", "成本"],
    ["Payback runtime", "Temps de retour", "Время окупаемости", "Geri ödeme süresi", "Czas zwrotu", "Tiempo de retorno", "Tempo de retorno", "Amortisationszeit", "회수 운영 시간", "回収稼働時間", "回本运行时间"],
    ["Total break-even", "Seuil de rentabilité total", "Общее время безубыточности", "Toplam başa baş süresi", "Łączny próg rentowności", "Equilibrio total", "Equilíbrio total", "Gesamt-Break-even", "총 손익분기점", "合計損益分岐", "总盈亏平衡时间"],
    ["Profit at 30d", "Bénéfice à 30 j", "Прибыль за 30 дней", "30 gündeki kâr", "Zysk po 30 dniach", "Beneficio a 30 días", "Lucro em 30 dias", "Gewinn nach 30 Tagen", "30일 수익", "30日間の利益", "30 天收益"],
    ["How this is calculated", "Comment est-ce calculé", "Как это рассчитывается", "Hesaplama yöntemi", "Jak to jest obliczane", "Cómo se calcula", "Como isto é calculado", "Berechnung", "계산 방법", "計算方法", "计算方式"],
    ["The building keeps producing at its last completed level while the next upgrade builds. Break-even credits that intermediate output above your starting level and compares it with the selected upgrades' direct Food, Metal, and Oil costs; the 30-day result deducts each upgrade cost when that upgrade starts. Relative values convert unlike inputs and output into one comparison unit. Base prerequisite costs are excluded because they benefit the whole account, not only this producer.", "Le bâtiment continue de produire à son dernier niveau terminé pendant la construction de l'amélioration suivante. Le seuil de rentabilité crédite cette production intermédiaire au-dessus de votre niveau de départ et la compare aux coûts directs en nourriture, métal et pétrole des améliorations sélectionnées ; le résultat à 30 jours déduit chaque coût au début de l'amélioration. Les valeurs relatives convertissent les entrées et la production différentes en une unité de comparaison. Les coûts des prérequis de Base sont exclus, car ils profitent à tout le compte et pas seulement à ce producteur.", "Здание продолжает производство на последнем завершённом уровне, пока строится следующее улучшение. Расчёт безубыточности учитывает промежуточную выработку сверх начального уровня и сравнивает её с прямыми затратами выбранных улучшений на еду, металл и нефть; результат за 30 дней вычитает стоимость каждого улучшения в момент его начала. Относительные значения переводят разные затраты и выработку в одну единицу сравнения. Затраты на требования базы исключены, поскольку они полезны всему аккаунту, а не только этому производителю.", "Bina, sonraki yükseltme yapılırken son tamamlanan seviyesinde üretmeye devam eder. Başa baş hesabı, başlangıç seviyenizin üzerindeki ara üretimi hesaba katar ve seçilen yükseltmelerin doğrudan Yiyecek, Metal ve Petrol maliyetleriyle karşılaştırır; 30 günlük sonuç, her yükseltmenin maliyetini başladığı anda düşer. Göreli değerler farklı girdileri ve üretimi tek bir karşılaştırma birimine dönüştürür. Üs ön koşulu maliyetleri, yalnızca bu üreticiye değil tüm hesaba fayda sağladığı için hariç tutulur.", "Budynek nadal produkuje na ostatnim ukończonym poziomie podczas budowy kolejnego ulepszenia. Próg rentowności uwzględnia produkcję pośrednią ponad poziom początkowy i porównuje ją z bezpośrednimi kosztami wybranych ulepszeń w żywności, metalu i ropie; wynik 30-dniowy odejmuje koszt każdego ulepszenia w chwili jego rozpoczęcia. Względne wartości przeliczają różne nakłady i produkcję na jedną jednostkę porównawczą. Koszty wymagań Bazy są wykluczone, ponieważ służą całemu kontu, a nie tylko temu producentowi.", "El edificio sigue produciendo en su último nivel completado mientras se construye la siguiente mejora. El equilibrio acredita esa producción intermedia por encima de tu nivel inicial y la compara con los costes directos de comida, metal y petróleo de las mejoras seleccionadas; el resultado a 30 días resta el coste de cada mejora cuando comienza. Los valores relativos convierten entradas y producción distintas en una unidad de comparación. Se excluyen los costes de requisitos de Base porque benefician a toda la cuenta, no solo a este productor.", "O edifício continua a produzir no último nível concluído enquanto a melhoria seguinte é construída. O ponto de equilíbrio considera essa produção intermédia acima do nível inicial e compara-a com os custos diretos de comida, metal e petróleo das melhorias selecionadas; o resultado de 30 dias deduz o custo de cada melhoria quando ela começa. Os valores relativos convertem entradas e produção diferentes numa unidade de comparação. Os custos dos pré-requisitos da Base são excluídos porque beneficiam toda a conta, não apenas este produtor.", "Das Gebäude produziert während des Baus des nächsten Upgrades weiter auf seinem zuletzt abgeschlossenen Level. Der Break-even berücksichtigt diesen Zwischen­ertrag über deinem Startlevel und vergleicht ihn mit den direkten Nahrung-, Metall- und Ölkosten der ausgewählten Upgrades; beim 30-Tage-Ergebnis wird jedes Upgrade beim Start von den Kosten abgezogen. Relative Werte bringen unterschiedliche Eingaben und Erträge in eine Vergleichseinheit. Kosten von Basisvoraussetzungen werden ausgeschlossen, weil sie dem gesamten Konto zugutekommen und nicht nur diesem Produzenten.", "다음 업그레이드를 건설하는 동안 건물은 마지막으로 완료한 레벨에서 계속 생산합니다. 손익분기 계산은 시작 레벨을 초과하는 중간 생산량을 반영하여 선택한 업그레이드의 직접 식량·금속·석유 비용과 비교합니다. 30일 결과에서는 각 업그레이드가 시작될 때 비용을 차감합니다. 상대 가치는 서로 다른 투입 자원과 생산량을 하나의 비교 단위로 변환합니다. 기지 선행 조건 비용은 이 생산 시설만이 아니라 계정 전체에 이익이 되므로 제외합니다.", "次のアップグレードを建設している間も、建物は最後に完了したレベルで生産を続けます。損益分岐では開始レベルを上回る途中の生産量を加味し、選択したアップグレードの食料・金属・石油の直接コストと比較します。30日間の結果では、各アップグレードの開始時にそのコストを差し引きます。相対価値により、異なる投入資源と生産量を1つの比較単位に換算します。基地の前提条件コストはこの生産施設だけでなくアカウント全体に役立つため除外しています。", "建造下一个升级期间，建筑会继续按最后完成的等级生产。盈亏平衡会计入高于起始等级的中间产量，并将其与所选升级的直接食物、金属和石油成本进行比较；30 天结果会在每项升级开始时扣除其成本。相对价值会把不同投入和产出换算为同一个比较单位。基地前置条件成本不会计入，因为它们惠及整个账户，而不只是此生产设施。"],
    ["Free", "Gratuit", "Бесплатно", "Ücretsiz", "Bezpłatnie", "Gratis", "Grátis", "Kostenlos", "무료", "無料", "免费"],
    ["Never", "Jamais", "Никогда", "Asla", "Nigdy", "Nunca", "Nunca", "Nie", "없음", "なし", "永不"],
    ["Select a higher target level.", "Sélectionnez un niveau cible supérieur.", "Выберите более высокий целевой уровень.", "Daha yüksek bir hedef seviye seçin.", "Wybierz wyższy poziom docelowy.", "Selecciona un nivel objetivo superior.", "Selecione um nível alvo superior.", "Wähle ein höheres Ziel-Level.", "더 높은 목표 레벨을 선택하세요.", "より高い目標レベルを選択してください。", "请选择更高的目标等级。"],
    ["Target level must be higher than current level", "Le niveau cible doit être supérieur au niveau actuel", "Целевой уровень должен быть выше текущего", "Hedef seviye mevcut seviyeden yüksek olmalıdır", "Poziom docelowy musi być wyższy od obecnego", "El nivel objetivo debe ser superior al actual", "O nível alvo tem de ser superior ao atual", "Das Ziel-Level muss höher als das aktuelle Level sein", "목표 레벨은 현재 레벨보다 높아야 합니다", "目標レベルは現在のレベルより高くしてください", "目标等级必须高于当前等级"],
    ["Use your browser menu and choose Install app or Add to Home Screen.", "Ouvrez le menu du navigateur et choisissez Installer l'application ou Ajouter à l'écran d'accueil.", "Откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран».", "Tarayıcı menünüzü açın ve Uygulamayı yükle veya Ana ekrana ekle seçeneğini seçin.", "Otwórz menu przeglądarki i wybierz Zainstaluj aplikację lub Dodaj do ekranu głównego.", "Abre el menú del navegador y elige Instalar aplicación o Añadir a la pantalla de inicio.", "Abra o menu do navegador e escolha Instalar aplicação ou Adicionar ao ecrã principal.", "Öffne das Browsermenü und wähle App installieren oder Zum Startbildschirm hinzufügen.", "브라우저 메뉴에서 앱 설치 또는 홈 화면에 추가를 선택하세요.", "ブラウザーメニューからアプリをインストールまたはホーム画面に追加を選択してください。", "打开浏览器菜单并选择安装应用或添加到主屏幕。"],
    ["Z Route Producer ROI Calculator", "Calculateur de ROI des producteurs Z Route", "Калькулятор ROI производителей Z Route", "Z Route Üretici ROI Hesaplayıcı", "Kalkulator ROI producenta Z Route", "Calculadora de ROI de productores Z Route", "Calculadora de ROI de produtores Z Route", "Z-Route-Produzenten-ROI-Rechner", "Z Route 생산 시설 ROI 계산기", "Z Route生産施設ROI計算機", "Z Route 生产设施 ROI 计算器"],
    ["Z Route Base Planner", "Planificateur de Base Z Route", "Планировщик базы Z Route", "Z Route Üs Planlayıcı", "Planer Bazy Z Route", "Planificador de Base Z Route", "Planejador de Base Z Route", "Z-Route-Basisplaner", "Z Route 기지 플래너", "Z Route基地プランナー", "Z Route 基地规划器"],

    // Common runtime names from the progression and resource data.
    ["Defense Line", "Ligne de défense", "Линия обороны", "Savunma Hattı", "Linia obrony", "Línea de defensa", "Linha de defesa", "Verteidigungslinie", "방어선", "防衛線", "防线"],
    ["Hospital", "Hôpital", "Госпиталь", "Hastane", "Szpital", "Hospital", "Hospital", "Krankenhaus", "병원", "病院", "医院"],
    ["Radar", "Radar", "Радар", "Radar", "Radar", "Radar", "Radar", "Radar", "레이더", "レーダー", "雷达"],
    ["Alpha Research Division", "Division de recherche Alpha", "Исследовательский отдел «Альфа»", "Alfa Araştırma Birimi", "Dział Badań Alfa", "División de investigación Alfa", "Divisão de pesquisa Alpha", "Alpha-Forschungsabteilung", "알파 연구 부서", "アルファ研究部門", "阿尔法研究部"],
    ["Gear Craft Center", "Centre de fabrication d'équipement", "Центр изготовления снаряжения", "Teçhizat Üretim Merkezi", "Centrum Wytwarzania Wyposażenia", "Centro de fabricación de equipo", "Centro de fabricação de equipamentos", "Ausrüstungsfertigungszentrum", "장비 제작 센터", "ギア製作センター", "装备制造中心"],
    ["Alliance Center", "Centre de l'alliance", "Центр альянса", "İttifak Merkezi", "Centrum Sojuszu", "Centro de alianza", "Centro da aliança", "Allianz-Zentrum", "연맹 센터", "同盟センター", "联盟中心"],
    ["Farm", "Ferme", "Ферма", "Çiftlik", "Farma", "Granja", "Fazenda", "Farm", "농장", "農場", "农场"],
    ["Metal Smelting Plant", "Usine de fusion des métaux", "Завод плавки металла", "Metal Eritme Tesisi", "Huta metalu", "Planta de fundición de metal", "Usina de fundição de metal", "Metallschmelzanlage", "금속 제련소", "金属精錬所", "金属冶炼厂"],
    ["Oil Extraction Well", "Puits d'extraction de pétrole", "Нефтяная скважина", "Petrol Çıkarma Kuyusu", "Szyb wydobywczy ropy", "Pozo de extracción de petróleo", "Poço de extração de petróleo", "Ölförderbrunnen", "석유 추출정", "石油採取井", "石油开采井"],
    ["Soldier Training Camp", "Camp d'entraînement des soldats", "Лагерь подготовки солдат", "Asker Eğitim Kampı", "Obóz szkoleniowy żołnierzy", "Campamento de entrenamiento de soldados", "Acampamento de treino de soldados", "Soldatenausbildungslager", "병사 훈련소", "兵士訓練キャンプ", "士兵训练营"],
    ["Training Ground", "Terrain d'entraînement", "Тренировочная площадка", "Eğitim Alanı", "Poligon szkoleniowy", "Campo de entrenamiento", "Campo de treino", "Trainingsplatz", "훈련장", "訓練場", "训练场"],
    ["Drill Ground", "Terrain d'exercices", "Строевая площадка", "Talim Alanı", "Plac musztry", "Campo de instrucción", "Campo de instrução", "Exerzierplatz", "훈련 연병장", "ドリルグラウンド", "操练场"],
    ["Squad 1", "Escouade 1", "Отряд 1", "Birlik 1", "Oddział 1", "Escuadrón 1", "Esquadrão 1", "Trupp 1", "분대 1", "分隊1", "小队 1"],
    ["Engineering Department", "Département d'ingénierie", "Инженерный отдел", "Mühendislik Departmanı", "Dział Inżynieryjny", "Departamento de ingeniería", "Departamento de engenharia", "Ingenieursabteilung", "공병 부서", "工学部門", "工程部"],
    ["Warrior Training Center", "Centre d'entraînement des guerriers", "Центр подготовки воинов", "Savaşçı Eğitim Merkezi", "Centrum szkoleniowe wojowników", "Centro de entrenamiento de guerreros", "Centro de treino de guerreiros", "Kriegertrainingszentrum", "전사 훈련 센터", "ウォリアー訓練センター", "战士训练中心"],
    ["Assault Training Center", "Centre d'entraînement d'assaut", "Центр подготовки штурмовиков", "Taarruz Eğitim Merkezi", "Centrum szkoleniowe szturmowców", "Centro de entrenamiento de asalto", "Centro de treino de assalto", "Sturmtruppentrainingszentrum", "돌격 훈련 센터", "アサルト訓練センター", "突击训练中心"],
    ["Tactical Training Center", "Centre d'entraînement tactique", "Центр тактической подготовки", "Taktik Eğitim Merkezi", "Centrum szkoleniowe taktyczne", "Centro de entrenamiento táctico", "Centro de treino tático", "Taktisches Trainingszentrum", "전술 훈련 센터", "戦術訓練センター", "战术训练中心"],
    ["Alloy Processing Plant", "Usine de traitement des alliages", "Завод обработки сплавов", "Alaşım İşleme Tesisi", "Zakład przetwarzania stopów", "Planta de procesamiento de aleaciones", "Usina de processamento de ligas", "Legierungsverarbeitungsanlage", "합금 처리 공장", "合金処理工場", "合金加工厂"],
    ["Gear Material Factory", "Usine de matériaux d'équipement", "Фабрика материалов для снаряжения", "Teçhizat Malzemesi Fabrikası", "Fabryka materiałów do wyposażenia", "Fábrica de materiales de equipo", "Fábrica de materiais de equipamento", "Ausrüstungsmaterialfabrik", "장비 재료 공장", "ギア素材工場", "装备材料工厂"],
    ["Alpha Research", "Recherche Alpha", "Исследования «Альфа»", "Alfa Araştırma", "Badania Alfa", "Investigación Alfa", "Pesquisa Alpha", "Alpha-Forschung", "알파 연구", "アルファ研究", "阿尔法研究"],
    ["Soldier Camp", "Camp de soldats", "Лагерь солдат", "Asker Kampı", "Obóz żołnierzy", "Campamento de soldados", "Acampamento de soldados", "Soldatenlager", "병사 캠프", "兵士キャンプ", "士兵营"],
    ["Warrior Center", "Centre des guerriers", "Центр воинов", "Savaşçı Merkezi", "Centrum wojowników", "Centro de guerreros", "Centro de guerreiros", "Kriegerzentrum", "전사 센터", "ウォリアーセンター", "战士中心"],
    ["Assault Center", "Centre d'assaut", "Центр штурмовиков", "Taarruz Merkezi", "Centrum szturmowców", "Centro de asalto", "Centro de assalto", "Sturmtruppenzentrum", "돌격 센터", "アサルトセンター", "突击中心"],
    ["Tactical Center", "Centre tactique", "Тактический центр", "Taktik Merkezi", "Centrum taktyczne", "Centro táctico", "Centro tático", "Taktikzentrum", "전술 센터", "戦術センター", "战术中心"],
    ["Engineering", "Ingénierie", "Инженерия", "Mühendislik", "Inżynieria", "Ingeniería", "Engenharia", "Ingenieurwesen", "공병", "工学", "工程"],
    ["Food", "Nourriture", "Еда", "Yiyecek", "Żywność", "Comida", "Comida", "Nahrung", "식량", "食料", "食物"],
    ["Metal", "Métal", "Металл", "Metal", "Metal", "Metal", "Metal", "Metall", "금속", "金属", "金属"],
    ["Oil", "Pétrole", "Нефть", "Petrol", "Ropa", "Petróleo", "Petróleo", "Öl", "석유", "石油", "石油"],
    ["Hero EXP", "EXP de héros", "Опыт героев", "Kahraman TP", "PD bohaterów", "EXP de héroe", "EXP de heróis", "Helden-EP", "영웅 경험치", "ヒーローEXP", "英雄经验"],
    ["Produced material", "Matériau produit", "Производимый материал", "Üretilen malzeme", "Produkowany materiał", "Material producido", "Material produzido", "Produziertes Material", "생산 재료", "生産素材", "产出材料"],
    ["Refined Stone", "Pierre raffinée", "Обработанный камень", "Rafine Taş", "Przetworzony kamień", "Piedra refinada", "Pedra refinada", "Veredelter Stein", "정제석", "精製石", "精炼石"],
    ["Steel", "Acier", "Сталь", "Çelik", "Stal", "Acero", "Aço", "Stahl", "강철", "鋼鉄", "钢铁"],
    ["Quick Construction I", "Construction rapide I", "Быстрое строительство I", "Hızlı İnşaat I", "Szybkie budowanie I", "Construcción rápida I", "Construção rápida I", "Schnelles Bauen I", "빠른 건설 I", "クイック建設 I", "快速建造 I"],
    ["Quick Construction II", "Construction rapide II", "Быстрое строительство II", "Hızlı İnşaat II", "Szybkie budowanie II", "Construcción rápida II", "Construção rápida II", "Schnelles Bauen II", "빠른 건설 II", "クイック建設 II", "快速建造 II"],
    ["Quick Construction III", "Construction rapide III", "Быстрое строительство III", "Hızlı İnşaat III", "Szybkie budowanie III", "Construcción rápida III", "Construção rápida III", "Schnelles Bauen III", "빠른 건설 III", "クイック建設 III", "快速建造 III"],
    ["Quick Construction IV", "Construction rapide IV", "Быстрое строительство IV", "Hızlı İnşaat IV", "Szybkie budowanie IV", "Construcción rápida IV", "Construção rápida IV", "Schnelles Bauen IV", "빠른 건설 IV", "クイック建設 IV", "快速建造 IV"],

    // These fixed pairs are emitted together by the producer selector.
    ["Farm · Food", "Ferme · Nourriture", "Ферма · Еда", "Çiftlik · Yiyecek", "Farma · Żywność", "Granja · Comida", "Fazenda · Comida", "Farm · Nahrung", "농장 · 식량", "農場 · 食料", "农场 · 食物"],
    ["Metal Smelting Plant · Metal", "Usine de fusion des métaux · Métal", "Завод плавки металла · Металл", "Metal Eritme Tesisi · Metal", "Huta metalu · Metal", "Planta de fundición de metal · Metal", "Usina de fundição de metal · Metal", "Metallschmelzanlage · Metall", "금속 제련소 · 금속", "金属精錬所 · 金属", "金属冶炼厂 · 金属"],
    ["Oil Extraction Well · Oil", "Puits d'extraction de pétrole · Pétrole", "Нефтяная скважина · Нефть", "Petrol Çıkarma Kuyusu · Petrol", "Szyb wydobywczy ropy · Ropa", "Pozo de extracción de petróleo · Petróleo", "Poço de extração de petróleo · Petróleo", "Ölförderbrunnen · Öl", "석유 추출정 · 석유", "石油採取井 · 石油", "石油开采井 · 石油"],
    ["Training Ground · Hero EXP", "Terrain d'entraînement · EXP de héros", "Тренировочная площадка · Опыт героев", "Eğitim Alanı · Kahraman TP", "Poligon szkoleniowy · PD bohaterów", "Campo de entrenamiento · EXP de héroe", "Campo de treino · EXP de heróis", "Trainingsplatz · Helden-EP", "훈련장 · 영웅 경험치", "訓練場 · ヒーローEXP", "训练场 · 英雄经验"],
    ["Alloy Processing Plant · Refined Stone", "Usine de traitement des alliages · Pierre raffinée", "Завод обработки сплавов · Обработанный камень", "Alaşım İşleme Tesisi · Rafine Taş", "Zakład przetwarzania stopów · Przetworzony kamień", "Planta de procesamiento de aleaciones · Piedra refinada", "Usina de processamento de ligas · Pedra refinada", "Legierungsverarbeitungsanlage · Veredelter Stein", "합금 처리 공장 · 정제석", "合金処理工場 · 精製石", "合金加工厂 · 精炼石"],
    ["Gear Material Factory · Steel", "Usine de matériaux d'équipement · Acier", "Фабрика материалов для снаряжения · Сталь", "Teçhizat Malzemesi Fabrikası · Çelik", "Fabryka materiałów do wyposażenia · Stal", "Fábrica de materiales de equipo · Acero", "Fábrica de materiais de equipamento · Aço", "Ausrüstungsmaterialfabrik · Stahl", "장비 재료 공장 · 강철", "ギア素材工場 · 鋼鉄", "装备材料工厂 · 钢铁"]
  ];

  const dictionaries = Object.fromEntries(LANGUAGES.map(language => [language.code, Object.create(null)]));
  for (const row of ROWS) {
    const english = row[0];
    LANGUAGES.forEach((language, index) => {
      dictionaries[language.code][english] = row[index] || english;
    });
  }

  const originalText = new WeakMap();
  const renderedText = new WeakMap();
  const originalAttributes = new WeakMap();
  const renderedAttributes = new WeakMap();
  let currentLanguage = "en";
  let observer;
  let selectorReady = false;

  function documentObject() {
    return global.document || (typeof document !== "undefined" ? document : null);
  }

  function normalizeLanguage(value) {
    if (typeof value !== "string") return null;
    const code = value.trim().toLowerCase().replace(/_/g, "-").split("-")[0];
    return LANGUAGE_CODES.has(code) ? code : null;
  }

  function languageInfo(code = currentLanguage) {
    return LANGUAGES.find(language => language.code === code) || LANGUAGES[0];
  }

  function readStorage() {
    try {
      for (const key of STORAGE_KEYS) {
        const value = normalizeLanguage(global.localStorage?.getItem(key));
        if (value) return value;
      }
    } catch (_) {
      // Storage can be unavailable in private browsing or sandboxed documents.
    }
    return null;
  }

  function browserLanguage() {
    const navigatorObject = global.navigator;
    const candidates = navigatorObject?.languages?.length ? navigatorObject.languages : [navigatorObject?.language];
    for (const value of candidates || []) {
      const language = normalizeLanguage(value);
      if (language) return language;
    }
    return null;
  }

  function queryLanguage() {
    try {
      const search = global.location?.search || "";
      return normalizeLanguage(new URLSearchParams(search).get("lang"));
    } catch (_) {
      return null;
    }
  }

  function initialLanguage() {
    return queryLanguage() || readStorage() || browserLanguage() || "en";
  }

  function t(english) {
    if (typeof english !== "string") return english;
    return dictionaries[currentLanguage]?.[english] || english;
  }

  function ignored(node) {
    const doc = documentObject();
    if (!node || node.nodeType === 9) return false;
    const element = node.nodeType === 1 ? node : node.parentElement;
    if (!element) return false;
    if (["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(element.tagName)) return true;
    return Boolean(element.closest?.("[data-i18n-ignore], script, style, noscript, template"));
  }

  function translateTextNode(node) {
    if (!node || node.nodeType !== 3 || ignored(node)) return;
    const value = node.nodeValue;
    if (!value || !value.trim()) return;

    if (!originalText.has(node)) {
      originalText.set(node, value);
    } else if (renderedText.has(node) && value !== renderedText.get(node) && value !== originalText.get(node)) {
      // The application legitimately reused this node for new English content.
      // Treat that content as the new source while retaining switch safety.
      originalText.set(node, value);
    }

    const source = originalText.get(node);
    const exact = t(source);
    let translated = exact;
    if (exact === source) {
      const trimmed = source.trim();
      const trimmedTranslation = t(trimmed);
      if (trimmedTranslation !== trimmed) {
        translated = source.slice(0, source.indexOf(trimmed)) + trimmedTranslation + source.slice(source.indexOf(trimmed) + trimmed.length);
      }
    }
    if (node.nodeValue !== translated) node.nodeValue = translated;
    renderedText.set(node, translated);
  }

  function translatableAttribute(element, name) {
    if (!ATTRIBUTE_NAMES.includes(name)) return false;
    if (name === "content") return element.tagName === "META" && element.getAttribute("name") === "description";
    return true;
  }

  function translateAttribute(element, name) {
    if (!element || element.nodeType !== 1 || !translatableAttribute(element, name) || ignored(element)) return;
    const value = element.getAttribute(name);
    if (value === null || !value.trim()) return;

    let originals = originalAttributes.get(element);
    let rendered = renderedAttributes.get(element);
    if (!originals) {
      originals = new Map();
      originalAttributes.set(element, originals);
    }
    if (!rendered) {
      rendered = new Map();
      renderedAttributes.set(element, rendered);
    }
    if (!originals.has(name)) {
      originals.set(name, value);
    } else if (rendered.has(name) && value !== rendered.get(name) && value !== originals.get(name)) {
      originals.set(name, value);
    }

    const translated = t(originals.get(name));
    if (element.getAttribute(name) !== translated) element.setAttribute(name, translated);
    rendered.set(name, translated);
  }

  function apply(root) {
    const doc = documentObject();
    if (!doc) return;
    const start = root || doc;
    const pending = [start];
    while (pending.length) {
      const node = pending.pop();
      if (!node) continue;
      if (node.nodeType === 3) {
        translateTextNode(node);
        continue;
      }
      if (node.nodeType !== 1 && node.nodeType !== 9 && node.nodeType !== 11) continue;
      if (node.nodeType === 1) {
        if (ignored(node)) continue;
        for (const name of ATTRIBUTE_NAMES) translateAttribute(node, name);
      }
      const children = node.childNodes;
      if (!children) continue;
      for (let index = children.length - 1; index >= 0; index -= 1) pending.push(children[index]);
    }
  }

  function updateUrl(code) {
    try {
      if (!global.location || !global.history?.replaceState) return;
      const url = new URL(global.location.href);
      url.searchParams.set("lang", code);
      global.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } catch (_) {
      // A file URL or restricted history implementation may not be writable.
    }
  }

  function persist(code) {
    try {
      const storage = global.localStorage;
      if (!storage) return;
      // Keep the two project-specific names in sync for pages that shared
      // the preference before this planner had its own selector.
      storage.setItem(STORAGE_KEYS[0], code);
      storage.setItem(STORAGE_KEYS[1], code);
      storage.setItem(STORAGE_KEYS[2], code);
    } catch (_) {
      // Preference persistence is best effort.
    }
  }

  function dispatchLanguageChange() {
    const doc = documentObject();
    if (!doc) return;
    let event;
    try {
      event = new global.Event("languagechange");
    } catch (_) {
      event = doc.createEvent("Event");
      event.initEvent("languagechange", false, false);
    }
    doc.dispatchEvent(event);
  }

  function setLanguage(value, options = {}) {
    const code = normalizeLanguage(value) || "en";
    const changed = code !== currentLanguage;
    currentLanguage = code;
    const info = languageInfo(code);
    const doc = documentObject();
    if (doc?.documentElement) doc.documentElement.lang = code;

    const selector = doc?.getElementById("language-select");
    if (selector && selector.value !== code) selector.value = code;
    if (options.persist !== false) persist(code);
    if (options.updateUrl !== false) updateUrl(code);

    apply();
    if (changed) {
      dispatchLanguageChange();
      // The planner listens synchronously and may replace translated nodes.
      apply();
    }
    return info;
  }

  function initSelector() {
    const doc = documentObject();
    const selector = doc?.getElementById("language-select");
    if (!selector) return false;
    if (!selectorReady) {
      while (selector.firstChild) selector.removeChild(selector.firstChild);
      for (const language of LANGUAGES) {
        const option = doc.createElement("option");
        option.value = language.code;
        option.textContent = language.label;
        option.setAttribute("data-i18n-ignore", "true");
        selector.appendChild(option);
      }
      selector.addEventListener("change", event => setLanguage(event.target.value));
      selectorReady = true;
    }
    selector.value = currentLanguage;
    if (!selector.getAttribute("aria-label")) selector.setAttribute("aria-label", "Language");
    return true;
  }

  function observe() {
    const doc = documentObject();
    if (!doc?.documentElement || observer || !global.MutationObserver) return;
    observer = new global.MutationObserver(records => {
      if (!selectorReady) initSelector();
      for (const record of records) {
        if (record.type === "childList") {
          record.addedNodes.forEach(node => apply(node));
        } else if (record.type === "characterData") {
          apply(record.target);
        } else if (record.type === "attributes") {
          apply(record.target);
        }
      }
    });
    observer.observe(doc.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRIBUTE_NAMES
    });
  }

  function init() {
    currentLanguage = initialLanguage();
    initSelector();
    const doc = documentObject();
    if (doc?.documentElement) doc.documentElement.lang = currentLanguage;
    apply();
    observe();
    return languageInfo();
  }

  const api = {
    languages: LANGUAGES.map(language => language.code),
    languageNames: Object.fromEntries(LANGUAGES.map(language => [language.code, language.label])),
    get language() { return currentLanguage; },
    get lang() { return currentLanguage; },
    get locale() { return languageInfo().locale; },
    get numberLocale() { return languageInfo().locale; },
    t,
    apply,
    init,
    setLanguage
  };

  global.I18N = api;
  init();
  if (global.addEventListener) global.addEventListener("DOMContentLoaded", initSelector, {once: true});
})(typeof window !== "undefined" ? window : globalThis);
