import LogoBadge from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bot,
  Plus,
  LogOut,
  MessageSquare,
  Boxes,
  ChevronRight,
  Settings,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { setUserData } from "@/redux/userSlice";
import logout from "@/features/logout";
import { Link, useLocation } from "react-router-dom";
import NotificationDropdown from "@/components/NotificationDropdown";

export const Navbar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { userData } = useSelector((state) => state.user);

  const handleLogout = async () => {
    try {
      await logout();
      dispatch(setUserData(null));
    } catch (error) {
      console.error("Logout Error:", error?.message);
    }
  };

  const navLinks = [
    {
      to: "/",
      label: "Chat Workspace",
      icon: MessageSquare,
      exact: true,
      activeColor: "text-[#FFC93C]",
    },
    {
      to: "/agents",
      label: "My Agents",
      icon: Bot,
      activeColor: "text-[#FFC93C]",
    },
    {
      to: "/integration",
      label: "Integrations",
      icon: Boxes,
      activeColor: "text-[#FFC93C]",
    },
  ];

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 1. DESKTOP LEFT SIDEBAR (Visible on md and above)              */}
      {/* ============================================================== */}
      <aside className="hidden md:flex flex-col justify-between w-60 h-screen shrink-0 border-r border-[#2B2D31]/80 bg-[#16171B] p-4 select-none z-30">
        {/* Top: Brand Logo + Primary Action + Navigation */}
        <div className="flex flex-col gap-4">
          {/* Logo Brand Header + Notifications */}
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/[0.04] transition-colors"
            >
              <LogoBadge size="sm" layout="row" />
            </Link>
            <NotificationDropdown />
          </div>

          {/* Create New Agent Button */}
          <Link to="/createAgent" className="w-full">
            <button
              type="button"
              className="w-full h-9 px-3.5 rounded-xl text-xs font-bold bg-[#FFC93C] hover:bg-[#e6b435] text-black flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_0_15px_rgba(255,201,60,0.2)] hover:shadow-[0_0_20px_rgba(255,201,60,0.35)] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Agent</span>
            </button>
          </Link>

          {/* Navigation Section */}
          <div className="flex flex-col gap-1 pt-3">
            <span className="px-2.5 pb-1.5 text-[10px] font-semibold tracking-wider uppercase text-[#949BA4]">
              Navigation
            </span>

            <nav className="flex flex-col gap-1 w-full">
              {navLinks.map((item) => {
                const active = isActive(item.to, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-colors duration-150 ${
                      active
                        ? "bg-[#232428] border border-[#383A40] text-white font-semibold shadow-sm"
                        : "text-[#949BA4] hover:text-white hover:bg-white/[0.05] font-medium"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active ? item.activeColor : "text-[#949BA4]"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom: Settings + User Profile Card */}
        <div className="flex flex-col gap-2 pt-3 border-t border-[#2B2D31]/80 w-full">
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-colors duration-150 ${
              isActive("/settings")
                ? "bg-[#232428] border border-[#383A40] text-white font-semibold shadow-sm"
                : "text-[#949BA4] hover:text-white hover:bg-white/[0.05] font-medium"
            }`}
          >
            <Settings
              className={`w-4 h-4 shrink-0 ${
                isActive("/settings") ? "text-[#FFC93C]" : "text-[#949BA4]"
              }`}
            />
            <span className="truncate">Settings</span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="w-full p-2 rounded-xl bg-[#1E1F24]/80 hover:bg-[#25272E] border border-[#2B2D31] hover:border-white/20 flex items-center justify-between gap-2.5 cursor-pointer transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {userData?.profilePicture ? (
                      <img
                        src={userData.profilePicture}
                        alt={userData.name || "User"}
                        className="w-8 h-8 rounded-lg object-cover shrink-0 pointer-events-none"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-[#FFC93C] text-black font-bold text-xs flex items-center justify-center shrink-0 select-none">
                        {userData?.name ? userData.name[0].toUpperCase() : "U"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {userData?.name || "User Account"}
                      </p>
                      <p className="text-[10px] text-[#949BA4] truncate font-mono">
                        {userData?.email || ""}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#949BA4] group-hover:text-white transition-colors shrink-0" />
                </button>
              }
            />

            <DropdownMenuContent align="start" sideOffset={8} className="w-52">
              {userData && (
                <div className="px-3 py-2 border-b border-[#383A40] text-xs select-none">
                  <p className="font-semibold text-white truncate">
                    {userData.name || "User Account"}
                  </p>
                  <p className="text-[11px] text-[#D9DADC] truncate mt-0.5 font-mono">
                    {userData.email || ""}
                  </p>
                </div>
              )}

              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-400 hover:text-red-300"
              >
                <div className="flex items-center gap-2.5 w-full">
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Logout</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MOBILE TOP HEADER (Visible only on screens < md)            */}
      {/* ============================================================== */}
      <header className="md:hidden w-full border-b border-[#2B2D31]/80 bg-[#16171B]/95 backdrop-blur-xl px-4 h-14 flex items-center justify-between shrink-0 sticky top-0 z-40 select-none">
        <Link to="/" className="flex items-center gap-2">
          <LogoBadge size="sm" layout="row" />
        </Link>

        <div className="flex items-center gap-2">
          <NotificationDropdown />

          <Link to="/createAgent">
            <button
              type="button"
              className="h-8 px-2.5 rounded-full text-xs font-semibold bg-[#FFC93C] text-black flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="text-[11px]">New</span>
            </button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  className="size-8 p-0 bg-[#232428] hover:bg-[#2B2D31] border border-[#383A40] text-white flex items-center justify-center rounded-full cursor-pointer shadow-sm shrink-0"
                >
                  {userData?.profilePicture ? (
                    <img
                      src={userData.profilePicture}
                      alt={userData.name || "User"}
                      className="w-full h-full object-cover rounded-full pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#FFC93C] text-black flex items-center justify-center font-bold text-[11px] select-none">
                      {userData?.name ? userData.name[0].toUpperCase() : "U"}
                    </div>
                  )}
                </Button>
              }
            />

            <DropdownMenuContent align="end" sideOffset={6} className="w-52">
              <DropdownMenuItem className="cursor-pointer">
                <Link to="/" className="flex items-center gap-2.5 w-full">
                  <MessageSquare className="w-4 h-4 text-[#FFC93C] shrink-0" />
                  <span>Chat Workspace</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Link to="/agents" className="flex items-center gap-2.5 w-full">
                  <Bot className="w-4 h-4 text-[#FFC93C] shrink-0" />
                  <span>My Agents</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Link
                  to="/integration"
                  className="flex items-center gap-2.5 w-full"
                >
                  <Boxes className="w-4 h-4 text-[#FFC93C] shrink-0" />
                  <span>Integrations</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Link
                  to="/settings"
                  className="flex items-center gap-2.5 w-full"
                >
                  <Settings className="w-4 h-4 text-[#FFC93C] shrink-0" />
                  <span>Settings & Preferences</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-400 hover:text-red-300"
              >
                <div className="flex items-center gap-2.5 w-full">
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Logout</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
};

export default Navbar;
