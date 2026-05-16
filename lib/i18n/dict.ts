export const LANGS = ["en", "ru"] as const
export type Lang = (typeof LANGS)[number]
export const DEFAULT_LANG: Lang = "en"

type Dict = Record<string, string>

const en: Dict = {
  "brand.tagline": "Eurovision",
  "home.subtitle": "Home jury for the grand final. Vote with friends. End the night with douze points.",
  "home.create": "Create room",
  "home.join": "Join with code",
  "home.footer": "Final — May 16, 2026, 21:00 CET. Let's go.",

  "create.title": "Create a room",
  "create.hint": "Pick a host name. We'll generate a short room code to share with friends.",
  "create.name.label": "Your name",
  "create.name.placeholder": "e.g. Ignat",
  "create.submit": "Create room",

  "join.title": "Join a room",
  "join.hint": "Enter the room code your host shared.",
  "join.code.label": "Room code",
  "join.code.placeholder": "e.g. AB4F",
  "join.name.label": "Your name",
  "join.name.placeholder": "e.g. Alex",
  "join.submit": "Join",

  "room.share": "Share this code with friends",
  "room.code.copy": "Copy",
  "room.code.copied": "Copied",
  "room.voters": "In the room",
  "room.vote": "Vote",
  "room.douze": "Give douze points",
  "room.results": "Live leaderboard",
  "room.vs_reality": "Compare with reality",
  "room.host_view": "Open TV view",
  "room.start_douze": "Open douze round",
  "room.douze_locked": "Douze round not open yet",

  "vote.vocal": "Vocal",
  "vote.performance": "Stage / Performance",
  "vote.song": "Song",
  "vote.hotness": "Hotness",
  "vote.tap_hint": "Tap a number to set.",
  "vote.saved": "Saved",
  "vote.next": "Next →",
  "vote.prev": "← Prev",
  "vote.unsaved": "Not voted yet",

  "douze.title": "Distribute your 12 points",
  "douze.hint": "Pick your top 10 in order. Each pick gets points from 12 down to 1.",
  "douze.points_left": "Points left",
  "douze.submit": "Submit douze",
  "douze.submitted": "Submitted. Waiting for the rest of the jury.",
  "douze.reset": "Reset",

  "results.title": "Leaderboard",
  "results.column.country": "Country",
  "results.column.base": "Base",
  "results.column.douze": "Douze",
  "results.column.total": "Total",
  "results.awaiting_douze": "Douze round not opened yet — showing base score only.",
  "results.bonus.hotness": "Hottest acts",
  "results.bonus.vocal": "Best vocals",
  "results.bonus.performance": "Best performance",

  "admin.title": "Admin · real results",
  "admin.hint": "Paste 25 rows in final order: '1. Sweden', '2. Italy', etc. Country name or code works.",
  "admin.placeholder": "1. Sweden\n2. Italy\n3. France\n...",
  "admin.submit": "Save results",
  "admin.saved": "Saved. Voters can now see comparison.",
  "admin.open_douze": "Open douze round",
  "admin.douze_open": "Douze round is open",

  "reality.title": "Your top vs reality",
  "reality.locked": "Real results not loaded yet — ask the host.",
  "reality.your_top": "Your top 10",
  "reality.real_top": "Real top 10",
  "reality.accuracy": "Accuracy (Spearman ρ)",
  "reality.prophet": "Most accurate prophet",

  "host.title": "TV view",
  "host.hint": "Cast this tab to your TV. Updates live.",

  "lang.toggle": "RU / EN",
}

const ru: Dict = {
  "brand.tagline": "Евровидение",
  "home.subtitle": "Домашнее жюри финала. Голосуй с друзьями. В конце раздай дуз пуан.",
  "home.create": "Создать комнату",
  "home.join": "Войти по коду",
  "home.footer": "Финал — 16 мая 2026, 21:00 CET. Поехали.",

  "create.title": "Создать комнату",
  "create.hint": "Введи имя хоста — мы выдадим короткий код, которым ты поделишься с друзьями.",
  "create.name.label": "Твоё имя",
  "create.name.placeholder": "напр. Игнат",
  "create.submit": "Создать комнату",

  "join.title": "Войти в комнату",
  "join.hint": "Введи код, который дал хост.",
  "join.code.label": "Код комнаты",
  "join.code.placeholder": "напр. AB4F",
  "join.name.label": "Твоё имя",
  "join.name.placeholder": "напр. Саша",
  "join.submit": "Войти",

  "room.share": "Скинь этот код друзьям",
  "room.code.copy": "Скопировать",
  "room.code.copied": "Скопировано",
  "room.voters": "В комнате",
  "room.vote": "Голосовать",
  "room.douze": "Раздать дуз пуан",
  "room.results": "Лидерборд",
  "room.vs_reality": "Сравнить с реальностью",
  "room.host_view": "Открыть TV-режим",
  "room.start_douze": "Открыть дуз-пуан раунд",
  "room.douze_locked": "Дуз-пуан раунд ещё не открыт",

  "vote.vocal": "Вокал",
  "vote.performance": "Шоу",
  "vote.song": "Песня",
  "vote.hotness": "Сексуальность",
  "vote.tap_hint": "Тапни цифру чтобы поставить.",
  "vote.saved": "Сохранено",
  "vote.next": "Дальше →",
  "vote.prev": "← Назад",
  "vote.unsaved": "Ещё не голосовал",

  "douze.title": "Раздай свои 12 баллов",
  "douze.hint": "Выбери топ-10 по порядку. Каждый получит от 12 до 1.",
  "douze.points_left": "Осталось баллов",
  "douze.submit": "Отправить",
  "douze.submitted": "Готово. Ждём остальных.",
  "douze.reset": "Сбросить",

  "results.title": "Лидерборд",
  "results.column.country": "Страна",
  "results.column.base": "База",
  "results.column.douze": "Дуз пуан",
  "results.column.total": "Итог",
  "results.awaiting_douze": "Дуз-пуан раунд ещё не открыт — пока показан только базовый балл.",
  "results.bonus.hotness": "Самые горячие",
  "results.bonus.vocal": "Лучший вокал",
  "results.bonus.performance": "Лучшее шоу",

  "admin.title": "Админка · реальные результаты",
  "admin.hint": "Вставь 25 строк в финальном порядке: '1. Sweden', '2. Italy', и так далее. Страна именем или кодом.",
  "admin.placeholder": "1. Sweden\n2. Italy\n3. France\n...",
  "admin.submit": "Сохранить результаты",
  "admin.saved": "Сохранено. Сравнение доступно всем.",
  "admin.open_douze": "Открыть дуз-пуан раунд",
  "admin.douze_open": "Дуз-пуан раунд открыт",

  "reality.title": "Твой топ vs реальность",
  "reality.locked": "Реальные результаты ещё не загружены — попроси хоста.",
  "reality.your_top": "Твой топ-10",
  "reality.real_top": "Реальный топ-10",
  "reality.accuracy": "Точность (Spearman ρ)",
  "reality.prophet": "Самый точный пророк",

  "host.title": "TV-режим",
  "host.hint": "Открой эту вкладку на телевизоре. Обновляется live.",

  "lang.toggle": "RU / EN",
}

export const dict: Record<Lang, Dict> = { en, ru }

export function tr(lang: Lang, key: string): string {
  return dict[lang][key] ?? dict[DEFAULT_LANG][key] ?? key
}
