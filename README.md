# TSP

GNOME Shell extension for emptying the system trash from the Activities search.

Press **Super**, search for `очистить корзину` or `empty trash`, then press **Enter**. The action also appears while typing the beginning of either phrase. TSP reports whether the trash was emptied or was already empty.

## Install from source

Requirements: GNOME Shell 45–50 and the `gnome-extensions` command.

```sh
git clone https://github.com/mikanight/tsp.git
cd tsp
gnome-extensions pack .
gnome-extensions install tsp@mikanight.shell-extension.zip
```

If GNOME Shell does not find the new extension in the current session, log out and back in. Then enable it:

```sh
gnome-extensions enable tsp@mikanight
```

## License

GPL-3.0-only. See [LICENSE](LICENSE).
