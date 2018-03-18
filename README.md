Интерфейс Терминатора
=====================

Демо: https://bakoushin.github.io/shri/multimedia

Интерфейс реализован двумя способами. Во-первых, чтобы поэкспериментировать, а во-вторых, чтобы лучше понять, как тот или иной способ отражается на FPS.

Для переключения можно использовать кнопки *Video* и *Canvas* в верхней части экрана.

В обоих вариантах поверх изображения с камеры отображаются рандомно генерируемые коды и виджет аудио: спектрограмма и уровень громкости.

Video
-----

Для коррекции цветов используется SVG-фильтр на элементе `video` и фильтр контраста.

С помощью псевдоэлемента `::after` в режиме наложения добавляется анимированная картинка помех.

Canvas
------

Коррекция цветов выполняется попиксельно.

Помехи добавляются рандомным смещением пикселей.
