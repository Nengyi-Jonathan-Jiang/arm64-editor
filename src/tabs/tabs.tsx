import React, {Key, ReactNode, useEffect} from "react";

import "./tabs.css";

function TabHead({name, selectSelf, deleteSelf, isActive, deletable}: {
    name: string,
    selectSelf: () => void,
    deleteSelf: (() => void) | undefined,
    isActive: boolean,
    deletable: boolean
}) {
    return <div className='tab-head' onClick={selectSelf} data-active={isActive ? "" : null}>
        <span>{name}</span>
        {
            deleteSelf !== undefined ? (
                deletable ? (
                    <button onClick={(e) => {
                        deletable && deleteSelf();
                        e.stopPropagation();
                    }} data-disabled={deletable ? null : ""}/>
                ) : (
                    <button aria-disabled/>
                )
            ) : null
        }
    </div>;
}

function NewTabButton({addTab}: { addTab: () => void }) {
    return <div className='new-tab-button'>
        <button onClick={addTab}></button>
    </div>;
}

export interface Tab<TabID> {
    name: string;
    id: TabID,
    deletable?: boolean;
    node: ReactNode;
}

export function Tabs<TabID extends Key>({tabs, addTab, deleteTab}: {
    tabs: Tab<TabID>[],
    addTab?: () => TabID | null,
    deleteTab?: (id: TabID) => void
}): ReactNode {
    const [currentTabID, setCurrentTabID] = React.useState<TabID | null>(null);

    if (new Set(tabs.map(({id}) => id)).size < tabs.length) {
        console.warn('Warning: tabs must have unique ids.');
    }
    if (tabs.find(({id}) => id === null)) {
        console.warn('Warning: tab ids cannot be null');
    }

    if (currentTabID !== null && !tabs.find(({id}) => id === currentTabID) && tabs.length > 0) {
        setCurrentTabID(tabs[tabs.length - 1].id);
    }

    return <div className='tabs-container'>
        <div className='tabs-header'>
            {
                tabs.map(({name, id, deletable}) => (
                    <TabHead key={id} name={name} deletable={deletable ?? true} deleteSelf={
                        deleteTab ? () => deleteTab(id) : undefined
                    } isActive={
                        id === currentTabID
                    } selectSelf={
                        () => setCurrentTabID(currentTabID === id ? null : id)
                    }/>
                ))
            }
            {addTab ? <NewTabButton addTab={() => {
                const addedTabID = addTab();
                if (addedTabID === null) return;
                setCurrentTabID(addedTabID);
            }}/> : null}

        </div>
        <div className='tabs-body'>
            {tabs.find(({id}) => id === currentTabID)?.node}
        </div>
    </div>
}