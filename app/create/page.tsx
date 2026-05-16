import Link from "next/link"
import { createRoom } from "@/lib/actions/rooms"
import { getT } from "@/lib/i18n/server"
import { SubmitButton } from "@/components/SubmitButton"

export default async function CreateRoomPage() {
  const { t } = await getT()
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6">
      <div className="card-glass w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="headline-lg text-3xl text-white">{t("create.title")}</h1>
          <p className="text-white/70 text-sm">{t("create.hint")}</p>
        </div>

        <form action={createRoom} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-white/80 text-sm font-medium">{t("create.name.label")}</span>
            <input
              name="name"
              required
              minLength={1}
              maxLength={32}
              placeholder={t("create.name.placeholder")}
              autoFocus
              className="w-full rounded-pill bg-white text-black px-5 py-3 outline-none focus:ring-2 ring-[color:var(--pink)]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-white/80 text-sm font-medium">{t("create.room_name.label")}</span>
            <input
              name="roomName"
              maxLength={48}
              placeholder={t("create.room_name.placeholder")}
              className="w-full rounded-pill bg-white/95 text-black px-5 py-3 outline-none focus:ring-2 ring-[color:var(--pink)]"
            />
          </label>

          <SubmitButton className="pill-pink w-full text-base py-3">
            {t("create.submit")}
          </SubmitButton>
        </form>

        <Link href="/" className="text-white/50 hover:text-white text-xs block text-center">
          ← Back
        </Link>
      </div>
    </main>
  )
}
