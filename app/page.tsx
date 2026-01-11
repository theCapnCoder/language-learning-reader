"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { BookUpload } from "@/components/book-upload"
import { BookCard } from "@/components/book-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search,
  Plus,
  BookOpen,
  Folder,
  ArrowLeft,
  FolderPlus,
  Edit2,
  Trash2,
  Check,
  X,
} from "lucide-react"
import { LocalDB } from "@/lib/db"
import type { Book } from "@/lib/db"
type SortOption =
  | "charCountAsc"
  | "charCountDesc"
  | "difficultyAsc"
  | "difficultyDesc"
  | "titleAsc"
  | "titleDesc"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function HomePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [folders, setFolders] = useState<Array<{ id: string; name: string; createdDate: Date }>>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showUpload, setShowUpload] = useState(false)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteConfirmFolder, setDeleteConfirmFolder] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("titleAsc")
  const { toast } = useToast()

  // Function to refresh folders from local storage
  const refreshFolders = useCallback(() => {
    const storedFolders = LocalDB.getFolders()
    setFolders(storedFolders)
  }, [])

  useEffect(() => {
    const loadedBooks = LocalDB.getBooks()
    setBooks(loadedBooks)
    refreshFolders()

    // Check for folder parameter in URL
    const folderParam = searchParams.get("folder")
    if (folderParam) {
      setCurrentFolderId(folderParam)
    } else {
      // Reset to null if no folder parameter
      setCurrentFolderId(null)
    }
  }, [refreshFolders, searchParams])

  // Add additional effect to handle data refresh when currentFolderId changes
  useEffect(() => {
    const loadedBooks = LocalDB.getBooks()
    setBooks(loadedBooks)
    refreshFolders()
  }, [currentFolderId, refreshFolders])

  // Add effect to handle page visibility changes (when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const loadedBooks = LocalDB.getBooks()
        setBooks(loadedBooks)
        refreshFolders()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [refreshFolders])

  const handleBooksUploaded = useCallback(
    (updatedBooks: Book[]) => {
      setBooks(updatedBooks)
      refreshFolders()
      setShowUpload(false)
    },
    [refreshFolders]
  )

  const handleDeleteBook = (bookId: string) => {
    const updatedBooks = books.filter((book) => book.id !== bookId)
    setBooks(updatedBooks)
    LocalDB.saveBooks(updatedBooks)

    toast({
      title: "Книга удалена",
      description: "Книга была успешно удалена из библиотеки",
    })
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return

    const newFolder = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      createdDate: new Date(),
    }

    const updatedFolders = [...folders, newFolder]
    LocalDB.saveFolders(updatedFolders)
    setFolders(updatedFolders)
    setNewFolderName("")
    setIsDialogOpen(false)

    toast({
      title: "Папка создана",
      description: `Папка "${newFolder.name}" была успешно создана`,
    })
  }

  const handleDeleteFolder = (folderId: string) => {
    try {
      // Count books in folder before deletion
      const booksInFolder = books.filter((book) => book.folderId === folderId)
      const deletedBookCount = booksInFolder.length

      // Delete all books in this folder
      const updatedBooks = books.filter((book) => book.folderId !== folderId)
      setBooks(updatedBooks)
      LocalDB.saveBooks(updatedBooks)

      // Delete folder
      const updatedFolders = folders.filter((folder) => folder.id !== folderId)
      LocalDB.saveFolders(updatedFolders)
      setFolders(updatedFolders)
      setCurrentFolderId(null)

      // Navigate to home page
      router.push("/")

      const folderName = folders.find((f) => f.id === folderId)?.name || "Папка"

      toast({
        title: "Папка и книги удалены",
        description: `Папка "${folderName}" и ${deletedBookCount} книг(и) были удалены`,
      })
    } catch (error) {
      console.error("Error deleting folder:", error)
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить папку. Попробуйте еще раз.",
      })
    }
  }

  const handleEditFolder = (folderId: string, newName: string) => {
    if (!newName.trim()) return

    const updatedFolders = folders.map((folder) =>
      folder.id === folderId ? { ...folder, name: newName.trim() } : folder
    )
    LocalDB.saveFolders(updatedFolders)
    setFolders(updatedFolders)
    setEditingFolder(null)

    toast({
      title: "Папка переименована",
      description: `Папка переименована в "${newName.trim()}"`,
    })
  }

  // Filter books based on current folder and search query
  const filteredBooks = books
    .filter((book) => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFolder = currentFolderId ? book.folderId === currentFolderId : !book.folderId
      return matchesSearch && matchesFolder
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "charCountAsc":
          return (a.charCount || 0) - (b.charCount || 0)
        case "charCountDesc":
          return (b.charCount || 0) - (a.charCount || 0)
        case "difficultyAsc":
          return (a.difficultyPercentage || 0) - (b.difficultyPercentage || 0)
        case "difficultyDesc":
          return (b.difficultyPercentage || 0) - (a.difficultyPercentage || 0)
        case "titleAsc":
          return a.title.localeCompare(b.title, undefined, { numeric: true })
        case "titleDesc":
          return b.title.localeCompare(a.title, undefined, { numeric: true })
        default:
          return 0
      }
    })

  const currentFolder = currentFolderId ? folders.find((f) => f.id === currentFolderId) : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {currentFolder && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentFolderId(null)
                  router.push("/")
                }}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-3xl font-bold text-balance">
              {currentFolder ? currentFolder.name : "Мои книги"}
            </h1>
          </div>
          <p className="text-muted-foreground">
            Управляйте своей библиотекой и отслеживайте прогресс изучения языка
          </p>
        </div>
        <div className="flex gap-2">
          {currentFolder && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingFolder(currentFolder.id)
                  setEditName(currentFolder.name)
                }}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Переименовать
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmFolder(currentFolder.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить папку
              </Button>
            </>
          )}
          <Button onClick={() => setShowUpload(!showUpload)} className="w-fit">
            <Plus className="h-4 w-4 mr-2" />
            Добавить книги
          </Button>
        </div>
      </div>

      {editingFolder && (
        <Dialog open={!!editingFolder} onOpenChange={() => setEditingFolder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Переименовать папку</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Новое название папки"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditFolder(editingFolder, editName)
                  if (e.key === "Escape") setEditingFolder(null)
                }}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEditFolder(editingFolder, editName)}
                  disabled={!editName.trim()}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Сохранить
                </Button>
                <Button variant="outline" onClick={() => setEditingFolder(null)}>
                  <X className="h-4 w-4 mr-2" />
                  Отмена
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {deleteConfirmFolder && (
        <Dialog open={!!deleteConfirmFolder} onOpenChange={() => setDeleteConfirmFolder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Подтверждение удаления</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Вы уверены, что хотите удалить папку "
                {folders.find((f) => f.id === deleteConfirmFolder)?.name}" и все книги в ней?
              </p>
              <p className="text-sm text-destructive">
                Это действие нельзя отменить. Будет удалено{" "}
                {books.filter((book) => book.folderId === deleteConfirmFolder).length} книг(и).
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    handleDeleteFolder(deleteConfirmFolder)
                    setDeleteConfirmFolder(null)
                  }}
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить папку и книги
                </Button>
                <Button variant="outline" onClick={() => setDeleteConfirmFolder(null)}>
                  Отмена
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload section */}
      {showUpload && (
        <BookUpload onBooksUploaded={handleBooksUploaded} currentFolderId={currentFolderId} />
      )}

      {!currentFolderId && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Папки</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                Создать папку
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать новую папку</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Название папки"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                />
                <div className="flex gap-2">
                  <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                    Создать
                  </Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Отмена
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {!currentFolderId && folders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {folders
            .sort((a, b) => {
              // Try to extract numbers from folder names for numeric sorting
              const aNum = parseInt(a.name.replace(/\D/g, ""))
              const bNum = parseInt(b.name.replace(/\D/g, ""))

              if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum
              }

              // Fallback to string comparison
              return a.name.localeCompare(b.name, undefined, { numeric: true })
            })
            .map((folder) => {
              const folderBookCount = books.filter((book) => book.folderId === folder.id).length
              return (
                <div
                  key={folder.id}
                  className="flex flex-col items-center p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors relative group"
                  onClick={() => {
                    setCurrentFolderId(folder.id)
                    router.push(`/?folder=${folder.id}`)
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirmFolder(folder.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                  <Folder className="h-12 w-12 text-blue-500 mb-2" />
                  <span className="text-sm font-medium text-center">{folder.name}</span>
                  <span className="text-xs text-muted-foreground">{folderBookCount} книг</span>
                </div>
              )
            })}
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Поиск книг..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Сортировать по..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Сортировка</SelectLabel>
              <SelectItem value="titleAsc">Название (А-Я)</SelectItem>
              <SelectItem value="titleDesc">Название (Я-А)</SelectItem>
              <SelectItem value="charCountAsc">Кол-во символов (по возрастанию)</SelectItem>
              <SelectItem value="charCountDesc">Кол-во символов (по убыванию)</SelectItem>
              <SelectItem value="difficultyAsc">Сложность (по возрастанию)</SelectItem>
              <SelectItem value="difficultyDesc">Сложность (по убыванию)</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Books grid */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onDelete={handleDeleteBook}
              onBookListChange={() => {
                const updatedBooks = LocalDB.getBooks()
                setBooks(updatedBooks)
                refreshFolders()
              }}
            />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Библиотека пуста</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Загрузите свои первые книги в формате .txt, чтобы начать изучение языка через чтение
          </p>
          <Button onClick={() => setShowUpload(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить первую книгу
          </Button>
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Книги не найдены</h3>
          <p className="text-muted-foreground">
            {currentFolder
              ? `В папке "${currentFolder.name}" нет книг`
              : "Попробуйте изменить поисковый запрос"}
          </p>
        </div>
      )}
    </div>
  )
}
