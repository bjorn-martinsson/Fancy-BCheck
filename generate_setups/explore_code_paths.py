# To be able to go through all possible choices, all possible paths in the code 
# is given an id ("path_id"). This allows exploring all possible code-paths.

def explore_paths(f, starting_id = 0):
    print('explodirng')
    path_id = -1
    next_path_id = starting_id # The initial path_id
    def make_choice(A):
        nonlocal part_previously_read, next_path_id
        m = len(A)
        alt = (path_id//part_previously_read) % m
        
        print('### Making a choice, chosing alternative:', alt)

        if alt != m - 1:
            nonlocal next_path_id
            next_path_id = (path_id + part_previously_read) % (m * part_previously_read)
        part_previously_read *= m
        return A[alt]
    next_path_id = 19847
    while path_id != next_path_id:
        path_id = next_path_id
        part_previously_read = 1
        
        print()
        print('STARTING NEW TEST, path_id:', path_id, flush=True)
        print()
        yield f(make_choice, path_id)
        exit()
