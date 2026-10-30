import { Folder } from "lucide-react"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { PATH } from "@/lib/constants"

export interface NavbarProps {
  isOnProject: boolean
  projectName?: string
  authRequired: boolean
  onLogout: () => void
}

export const Navbar = ({
  isOnProject,
  projectName,
  authRequired,
  onLogout,
}: NavbarProps) => {
  return (
    <header className="border-grid sticky top-0 z-50 w-full border-b">
      <div className="flex h-14 items-center px-6 gap-4 w-full">
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="Colombus Logo"
          className="w-8 h-8 rounded-lg shadow-sm shrink-0 object-cover"
        />

        <div className="flex items-center gap-3 text-sm">
          <Link
            to={PATH.HOME}
            className="flex items-center gap-2 transition-colors font-medium"
          >
            <Folder className="w-4 h-4" />
            <span>Projects</span>
          </Link>

          {isOnProject && (
            <>
              <span className="font-light">/</span>
              <span className="font-semibold">{projectName}</span>
            </>
          )}
        </div>

        {authRequired && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={onLogout}
          >
            Logout
          </Button>
        )}
      </div>
    </header>
  )
}
