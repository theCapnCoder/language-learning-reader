"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FolderPlus, Folder, Trash2, Edit2, Check, X } from "lucide-react"
import { LocalDB } from "@/lib/db"
import type { Folder as FolderType } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"

interface FolderManagerProps {
  folders: FolderType[]
  onFoldersUpdated: (folders: FolderType[]) => void
}

export function FolderManager({ folders, onFoldersUpdated }: FolderManagerProps) {
  const [newFolderName, setNewFolderName] = useState("")
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return

    const newFolder: FolderType = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      createdDate: new Date(),
    }

    const updatedFolders = [...folders, newFolder]
    LocalDB.saveFolders(updatedFolders)
    onFoldersUpdated(updatedFolders)
    setNewFolderName("")
    setIsDialogOpen(false)

    toast({
      title: "Папка создана",
      description: `Папка "${newFolder.name}" была успешно создана`,
    })
  }

  const handleDeleteFolder = (folderId: string) => {
    // Move books from this folder to root
    const books = LocalDB.getBooks()
    const updatedBooks = books.map((book) => (book.folderId === folderId ? { ...book, folderId: undefined } : book))
    LocalDB.saveBooks(updatedBooks)

    // Delete folder
    const updatedFolders = folders.filter((folder) => folder.id !== folderId)
    LocalDB.saveFolders(updatedFolders)
    onFoldersUpdated(updatedFolders)

    toast({
      title: "Папка удалена",
      description: "Папка была удалена, книги перемещены в корень",
    })
  }

  const handleEditFolder = (folderId: string, newName: string) => {
    if (!newName.trim()) return

    const updatedFolders = folders.map((folder) =>
      folder.id === folderId ? { ...folder, name: newName.trim() } : folder,
    )
    LocalDB.saveFolders(updatedFolders)
    onFoldersUpdated(updatedFolders)
    setEditingFolder(null)

    toast({
      title: "Папка переименована",
      description: `Папка переименована в "${newName.trim()}"`,
    })
  }

  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {folders.map((folder) => (
          <Card key={folder.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-blue-500" />
                {editingFolder === folder.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEditFolder(folder.id, editName)
                        if (e.key === "Escape") setEditingFolder(null)
                      }}
                      className="h-8"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEditFolder(folder.id, editName)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditingFolder(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{folder.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setEditingFolder(folder.id)
                          setEditName(folder.name)
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteFolder(folder.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
