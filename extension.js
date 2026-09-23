import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

class TrashSearchProvider {
    constructor(uuid) {
        this.id = uuid;
        this.appInfo = null;
        this.canLaunchSearch = false;
    }

    getInitialResultSet(terms) {
        const query = terms.join(' ').toLowerCase()
            .replace(/[^\p{L}\p{N}]+/gu, ' ')
            .trim();
        return query && ['очистить корзину', 'empty trash']
            .some(phrase => phrase.startsWith(query))
            ? ['empty-trash']
            : [];
    }

    getSubsearchResultSet(_previousResults, terms) {
        return this.getInitialResultSet(terms);
    }

    getResultMetas(results) {
        const {scaleFactor} = St.ThemeContext.get_for_stage(global.stage);

        return results.map(id => ({
            id,
            name: 'Очистить корзину / Empty Trash',
            createIcon: size => new St.Icon({
                icon_name: 'user-trash-full-symbolic',
                width: size * scaleFactor,
                height: size * scaleFactor,
            }),
        }));
    }

    activateResult() {
        try {
            Gio.File.new_for_uri('trash:///').query_info_async(
                'trash::item-count',
                Gio.FileQueryInfoFlags.NONE,
                GLib.PRIORITY_DEFAULT,
                null,
                (file, result) => {
                    try {
                        const info = file.query_info_finish(result);
                        if (info.get_attribute_uint32('trash::item-count') === 0) {
                            Main.notify(
                                'В вашей корзине пусто',
                                'Помните, что вы крутой, что бы не происходило!'
                            );
                            return;
                        }
                        this._emptyTrash();
                    } catch (error) {
                        logError(error, 'Failed to check trash');
                        Main.notifyError('Не удалось проверить корзину', error.message);
                    }
                }
            );
        } catch (error) {
            logError(error, 'Failed to check trash');
            Main.notifyError('Не удалось проверить корзину', error.message);
        }
    }

    _emptyTrash() {
        try {
            const process = Gio.Subprocess.new(
                ['gio', 'trash', '--empty'],
                Gio.SubprocessFlags.NONE
            );
            process.wait_check_async(null, (proc, result) => {
                try {
                    proc.wait_check_finish(result);
                    Main.notify(
                        'Ваша корзина очищена',
                        'Помните, что вы крутой, что бы не происходило!'
                    );
                } catch (error) {
                    logError(error, 'Failed to empty trash');
                    Main.notifyError('Не удалось очистить корзину', error.message);
                }
            });
        } catch (error) {
            logError(error, 'Failed to start gio trash');
            Main.notifyError('Не удалось очистить корзину', error.message);
        }
    }
}

export default class EmptyTrashSearchExtension extends Extension {
    enable() {
        this._provider = new TrashSearchProvider(this.uuid);
        Main.overview.searchController.addProvider(this._provider);

        // ponytail: GNOME has no public provider-priority API; reorder its private results list.
        const results = Main.overview.searchController._searchResults;
        const index = results._providers.indexOf(this._provider);
        if (index > 0) {
            results._providers.splice(index, 1);
            results._providers.unshift(this._provider);
            results._content.insert_child_at_index(this._provider.display, 0);
        }
    }

    disable() {
        Main.overview.searchController.removeProvider(this._provider);
        this._provider = null;
    }
}
